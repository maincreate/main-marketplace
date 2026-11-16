# Main{Create} marketplace

The official builder catalog contains versioned toolkit profiles in `registry/toolkits.json`, ESP32 hardware-to-SDK compatibility in `registry/microcontrollers.json`, and Android device target profiles in `registry/android-devices.json`. Toolkit profiles are validated against `schemas/toolkits.schema.json`.

[main-platform](https://github.com/maincreate/main-platform) consumes the vendored catalog. It owns compatibility resolution, builder installation state, GitHub runner labels, scheduling, artifact handoff and approval. Reviewed installers, build/deploy/backup/restore adapters and cleanup executors belong to [main-builders](https://github.com/maincreate/main-builders).

## Artifact-specific toolkit lifecycle

Every toolkit version declares exact version/provenance, host OS/architecture compatibility, artifact and target types, build/deploy/backup/restore capabilities, and safe cleanup guidance. ESP-IDF creates and flashes firmware images. Android creates and deploys APK application artifacts through ADB; it is not an Android OS firmware flasher.

Runner labels are derived from verified installed versions and validated capabilities. A build runner may differ from the deployment runner; artifacts move between them with a target/checksum manifest.

See [Versioned toolkit lifecycle](docs/toolkit-lifecycle.md) for compatibility, labels, the current ESP-IDF and Android profiles, and the Android 5.1.1 E Ink target.
