package app.cybertv.player;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.util.Log;

/**
 * Result of an update installed through PackageInstaller: when Android still wants the user to
 * confirm (first self-update, Android 11 and older, Play Protect check), its screen is opened here.
 */
public class InstallResultReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm != null) {
                confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(confirm);
            }
        } else if (status == PackageInstaller.STATUS_SUCCESS) {
            // the update replaced the running app: open it again (best effort: some Android versions
            // refuse activity starts from the background, the app is then simply closed)
            try {
                Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                if (open != null) {
                    open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    context.startActivity(open);
                }
            } catch (Exception e) {
                Log.w("CyberUpdater", "relaunch after update failed", e);
            }
        } else {
            Log.w("CyberUpdater", "install failed: " + status + " " + intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE));
        }
    }
}
