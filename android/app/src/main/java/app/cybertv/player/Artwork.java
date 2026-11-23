package app.cybertv.player;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;

/** Limit both the compressed download and decoded pixels. Work from disk so two
 * concurrent poster requests never hold two original files on the Java heap. */
final class Artwork {
    private static final int MAX_DOWNLOAD = 16 * 1024 * 1024;

    static int edge(String size) {
        if ("hero".equals(size)) return 1024;
        if ("logo".equals(size)) return 224;
        return 448;
    }

    static void download(InputStream stream, File target) throws IOException {
        byte[] buffer = new byte[32768];
        int total = 0;
        try (FileOutputStream out = new FileOutputStream(target)) {
            for (int n; (n = stream.read(buffer)) >= 0;) {
                total += n;
                if (total > MAX_DOWNLOAD) throw new IOException("image too large");
                out.write(buffer, 0, n);
            }
        }
        if (total == 0) throw new IOException("empty image");
    }

    static boolean thumbnail(File source, File target, int edge) throws IOException {
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(source.getPath(), options);
        // Keep SVGs, animated images and unrecognised formats intact.
        boolean jpeg = "image/jpeg".equals(options.outMimeType);
        boolean png = "image/png".equals(options.outMimeType);
        boolean webp = "image/webp".equals(options.outMimeType);
        if (!(jpeg || png || webp) || options.outWidth <= 0 || options.outHeight <= 0) return false;
        if (webp || png) {
            try (RandomAccessFile raf = new RandomAccessFile(source, "r")) {
                if (animated(raf, webp)) return false;
            }
        }
        int longest = Math.max(options.outWidth, options.outHeight);
        if (longest <= edge && source.length() < 24000) return false;
        options.inJustDecodeBounds = false;
        options.inSampleSize = 1;
        while (longest / options.inSampleSize / 2 >= edge) options.inSampleSize *= 2;
        Bitmap decoded = BitmapFactory.decodeFile(source.getPath(), options);
        if (decoded == null) return false;
        Bitmap scaled = decoded;
        try {
            float ratio = Math.min(1f, (float)edge / Math.max(decoded.getWidth(), decoded.getHeight()));
            if (ratio < 1f) scaled = Bitmap.createScaledBitmap(decoded, Math.max(1,Math.round(decoded.getWidth()*ratio)),
                    Math.max(1,Math.round(decoded.getHeight()*ratio)), true);
            try (FileOutputStream out = new FileOutputStream(target)) {
                return scaled.compress(Bitmap.CompressFormat.WEBP, 78, out)
                        && (longest > edge || target.length() < source.length());
            }
        } finally {
            if (scaled != decoded) scaled.recycle();
            decoded.recycle();
        }
    }

    private static boolean animated(RandomAccessFile file, boolean webp) throws IOException {
        if (webp) {
            if (file.length() < 21) return false;
            file.seek(12);
            return file.readInt() == 0x56503858 && file.skipBytes(4) == 4 && (file.readByte() & 2) != 0;
        }
        file.seek(8);
        while (file.getFilePointer() + 8 <= file.length()) {
            long length = Integer.toUnsignedLong(file.readInt());
            int type = file.readInt();
            if (type == 0x6163544C) return true;  // acTL precedes the first IDAT
            if (type == 0x49444154) return false;
            file.seek(file.getFilePointer() + length + 4);
        }
        return false;
    }
}
