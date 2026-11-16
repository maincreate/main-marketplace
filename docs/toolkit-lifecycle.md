# Versioned toolkit lifecycle

## Ownership boundaries

- **main-marketplace** owns declarative toolkit metadata: exact versions, upstream provenance, supported builder OS/architecture combinations, target device profiles, artifact types, capabilities, limitations and cleanup guidance.
- **main-platform** owns policy, compatibility resolution, installation orchestration, builder inventory, GitHub runner labels, job scheduling, artifact handoff, approval UX and audit.
- **main-builders** owns reviewed, version-pinned installers, validators, build adapters, device deployment, object-specific backup/restore and cleanup executors.

Marketplace records MUST NOT contain shell commands, scripts, executable hooks, arbitrary URLs supplied by users, or privileged implementation details. A `recipeId` or `capabilityId` references a reviewed implementation; it is not executable by itself.

## Separate the host, toolkit, artifact and target device

These are independent compatibility dimensions:

1. **Builder host** — OS and CPU architecture on which the toolkit is installed and executed.
2. **Toolkit version** — exact installed framework/toolchain release.
3. **Artifact target** — the firmware family, Android API target, app ABI, or other output type.
4. **Device operation target** — the actual connected device, its identity, transport, OS/API, ABI, and device-specific permissions.

Do not confuse the builder's architecture with the target device's architecture. An x64 or macOS ARM64 runner can build an APK containing `armeabi-v7a` native code for a 32-bit ARM Android device. Likewise, an ESP-IDF build on x64 can produce ESP32 firmware that is flashed later by a separate Linux ARM64 runner connected to the board.

Build and deployment may run on different machines. The build runner emits an immutable artifact and manifest containing source revision, toolkit/version, artifact type, target profile, target chip/API/ABI, checksum, and signing-key identifier (never the private key). A deployment runner verifies the manifest and target before writing/installing.

## GitHub runner labels

Main{Create} Platform derives labels from verified machine state, not from user-entered declarations. A builder receives a toolkit/version label only after installation and executable-version verification; it receives capability/target labels only after the relevant adapter, permissions, and device access are validated.

Example ESP-IDF labels:

```text
self-hosted, maincreate, linux, arm64,
toolkit-esp-idf-6-1-1, capability-firmware-build, target-esp32
```

Example Android app build labels:

```text
self-hosted, maincreate, macos, arm64,
toolkit-android-sdk-2026-2-2-patch1, capability-android-app-build,
target-android-api-22, target-device-avalue-epd-42s, target-abi-armeabi-v7a
```

An Android deployment runner has a separate `capability-android-app-deploy` label and must be connected to, and authorized for, the requested device. Uninstalling or invalidating a toolkit/capability removes the corresponding labels. Projects request all required labels; GitHub schedules only a runner with the complete combination.

## Lifecycle contract

Each version declares six lifecycle stages:

1. **Install** — exact toolkit version, upstream provenance, checksum/signature policy, host compatibility and approval.
2. **Build** — operation-specific artifact type, target profile, required installed version, and compatible host OS/architecture.
3. **Deploy** — the toolkit-specific operation on a specific object. ESP-IDF deploys/ flashes firmware images to ESP32 devices. Android deploys APK applications using ADB. Android application deployment is not Fastboot firmware flashing.
4. **Backup** — backs up the specific object owned by the toolkit, not a generic whole-device backup.
5. **Restore** — restores that same object type after target compatibility and integrity checks.
6. **Cleanup** — version-scoped removal with a dry-run inventory, reference checks, and a preservation list.

### ESP-IDF: firmware objects

Current upstream stable ESP-IDF is `6.1.1`; keep `5.5.6` as a selectable older version for existing projects. The catalog includes both exact versions. Espressif documents EIM installation on Linux, macOS and Windows, and provides an `eim install` path for the latest stable release.

ESP-IDF builds a complete firmware bundle for the selected ESP32 family: bootloader, partition table, application, declared data partitions, and a merged full firmware image where appropriate. The deployment operation flashes that firmware bundle to a matching chip. Backup/restore apply to ESP32 firmware-image objects, not generic peripherals or external device state.

Flash/readback requires an active `esptool` chip probe; a USB descriptor is not chip identity. Readback may be blocked or unusable with flash encryption, secure boot, read protection or chip-specific security settings. Firmware manifests record chip model, flash size, partition layout, security observations, SHA-256 and provenance. Restore rejects incompatible chip family, flash size, partition layout or security state.

The current `firmware.build` adapter remains **partial** until it enforces the marketplace-selected installed version. Install, deploy, backup, restore and cleanup adapters are planned and must not be advertised as executable until validated.

### Android: application objects

Current stable Android profile: Android Studio `2026.2.2 Patch 1`, command-line tools `15859902`, Platform-Tools `37.0.1` (stable; `37.0.3` is Canary), Build-Tools `36.0.0`, compile SDK/API `37`, Android Gradle Plugin `9.5.1`, Gradle `9.6.0`, and JDK `17`. The Android SDK profile is a build/deployment toolchain; it is not an Android OS firmware build system.

Official Android command-line tool packages are available for Linux x64, macOS x64, macOS ARM64, and Windows x64. Linux ARM64 is not an official Android Studio host. Android ADB deployment on Linux ARM64 can be enabled only after validating a native ADB package and USB permissions; this is independent of Android app build eligibility.

Two app target profiles are maintained by the same current toolchain:

- **Current Android:** compile/target API `37`, with minimum API and ABI selected per project.
- **Legacy E Ink Android:** compile with the current toolchain while enforcing Android `5.1.1` / API `22` runtime compatibility, `minSdk 22`, `targetSdk 22`, and APK output. Include `armeabi-v7a` native libraries when native code is used.

The registered device profile `avalue-epd-42s` describes the user's Avalue EPD-42S / `SABRESD_MX7D`, product `sabresd_7d_eink`, NXP/Freescale i.MX7D ARMv7, Android 5.1.1/API 22, kernel 3.14.52, and 2880x2160 E Ink panel using `mxc_epdc_fb`. The build host may be x64 or macOS ARM64; the target APK must match the device's API/ABI. Build can happen on one runner and ADB deployment on another.

Android's object operations are app-specific:

- **Build:** create APK (for direct device installation) and optionally AAB (distribution).
- **Deploy:** install/update the APK with `adb install`; do not use Fastboot for app deployment.
- **Backup:** preserve the verified APK artifact and, when the app supports it, application-owned data exports. Do not claim a whole-device backup or arbitrary private app-data extraction.
- **Restore:** reinstall a verified APK and import application-owned data where supported. Do not restore Android OS firmware or the whole device.

The generic Android SDK does not provide the E Ink vendor HAL, EPDC driver, waveform assets or BSP integration. App-level display control must use the device's existing vendor/BSP interface and be validated on the actual panel.

## Compatibility and labels

Compatibility is evaluated independently for install, build, deploy, backup and restore. A builder is eligible only if its observed host OS/architecture is compatible with the exact toolkit version and the specific operation. A connected target device is an additional requirement for deploy/backup/restore; it is not implied by the host being compatible.

`supported` in the catalog means the upstream/toolchain combination is supported. It does not mean a specific Main{Create} runner is ready. Platform must wait for successful installation, exact version verification, adapter self-tests and (for device operations) target probing before registering capability labels.

## Cleanup safety

Cleanup is per toolkit version and per host. It must:

- refuse removal while a job references the version;
- display the exact files, directories and packages to be removed;
- preserve shared components still referenced by another toolkit/version;
- preserve project checkouts, build outputs, APK/AAB/firmware artifacts, signing keys, device backups and user data;
- require explicit approval for deletion; and
- write a cleanup audit record with removed paths and final verification.

## Sources

- ESP-IDF stable v6.1.1: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html
- ESP-IDF Linux installation: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/linux-setup.html
- ESP-IDF macOS installation: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/macos-setup.html
- ESP-IDF Windows installation: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/windows-setup.html
- Android Studio stable release: https://developer.android.com/studio/releases
- Android Gradle Plugin: https://developer.android.com/build/releases/about-agp
- Android Platform-Tools: https://developer.android.com/tools/releases/platform-tools
- Android API 22: https://developer.android.com/tools/releases/platforms
- Android NDK ABIs: https://developer.android.com/ndk/guides/abis
