import { relaunch } from "@tauri-apps/plugin-process";
import {
  check,
  type DownloadEvent,
  type Update,
} from "@tauri-apps/plugin-updater";
import { toast } from "sonner";

const UPDATE_TOAST_ID = "app-update";

let hasCheckedForUpdate = false;
let isUpdating = false;

const formatBytes = (bytes: number) => {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, power);

  return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "An unknown update error occurred.";
};

const isTauriRuntime = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return "__TAURI_INTERNALS__" in window;
};

const beginDownloadAndInstall = async (update: Update) => {
  if (isUpdating) {
    return;
  }

  isUpdating = true;

  let downloaded = 0;
  let contentLength = 0;

  try {
    toast.loading("Downloading update...", {
      id: UPDATE_TOAST_ID,
      description: "Preparing download",
      duration: Infinity,
    });

    await update.downloadAndInstall((event: DownloadEvent) => {
      switch (event.event) {
        case "Started": {
          downloaded = 0;
          contentLength = event.data.contentLength ?? 0;

          toast.loading("Downloading update...", {
            id: UPDATE_TOAST_ID,
            description: `0% (${formatBytes(0)} / ${formatBytes(contentLength)})`,
            duration: Infinity,
          });

          break;
        }

        case "Progress": {
          downloaded += event.data.chunkLength;

          const progress =
            contentLength > 0
              ? Math.min((downloaded / contentLength) * 100, 100)
              : 0;

          toast.loading("Downloading update...", {
            id: UPDATE_TOAST_ID,
            description: `${progress.toFixed(0)}% (${formatBytes(downloaded)} / ${formatBytes(contentLength)})`,
            duration: Infinity,
          });

          break;
        }

        case "Finished": {
          toast.loading("Installing update...", {
            id: UPDATE_TOAST_ID,
            description: "Download complete",
            duration: Infinity,
          });

          break;
        }

        default:
          break;
      }
    });

    toast.success("Update installed", {
      id: UPDATE_TOAST_ID,
      description: "Restart the app to launch the latest version.",
      duration: Infinity,
      action: {
        label: "Restart",
        onClick: () => {
          void relaunch();
        },
      },
    });
  } catch (error) {
    toast.error("Update failed", {
      id: UPDATE_TOAST_ID,
      description: getErrorMessage(error),
      duration: 8000,
    });
  } finally {
    isUpdating = false;
  }
};

export const checkForAppUpdate = async () => {
  if (import.meta.env.DEV || hasCheckedForUpdate || !isTauriRuntime()) {
    return;
  }

  hasCheckedForUpdate = true;

  try {
    const update = await check();

    if (!update) {
      return;
    }

    const details = update.body?.trim()
      ? `Version ${update.version} is available. ${update.body.trim()}`
      : `Version ${update.version} is available.`;

    toast("Update available", {
      id: UPDATE_TOAST_ID,
      description: details,
      duration: Infinity,
      action: {
        label: "Update now",
        onClick: () => {
          void beginDownloadAndInstall(update);
        },
      },
    });
  } catch (error) {
    console.error("Failed to check for app updates", error);
  }
};
