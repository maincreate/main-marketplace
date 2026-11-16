# Versioned toolkit lifecycle

## Ownership boundaries

- **main-marketplace** owns declarative toolkit metadata: exact versions, upstream provenance, supported OS/architecture combinations, required components, device families, lifecycle references, limitations and cleanup guidance.
- **main-platform** owns policy, compatibility resolution, approval UX, job planning, audit, device identity, and capability registration.
- **main-builders** owns reviewed, version-pinned installers, validators, build adapters, flash/backup/restore adapters and cleanup executors.

Marketplace records MUST NOT contain shell commands, scripts, executable hooks, arbitrary URLs supplied by users, or privileged implementation details. A `recipeId` or `capabilityId` is a reference to a reviewed implementation in the appropriate repository; it is not executable by itself.

## Lifecycle contract

Every toolkit version describes all six lifecycle stages:

1. **Install** — exact toolkit version, immutable upstream source, checksum/signature policy, installation scope and approval requirement. Installation is idempotent and isolated by toolkit/version/host architecture.
2. **Build** — the capability to execute, required installed toolkit version, project revision policy, toolchain requirements and compatible runner OS/architecture.
3. **Flash / deploy to device** — supported device families and transports, active identity probe, compatibility checks, explicit approval and operation-specific risk. APK installation and bootloader partition flashing are distinct Android operations.
4. **Backup** — supported backup methods, what is captured, metadata, integrity checks, security restrictions and whether the result is restorable.
5. **Restore** — supported restore methods, exact target matching, integrity checks, destructive-operation warnings and explicit approval.
6. **Cleanup** — version-scoped removal recipe, dry-run inventory, reference checks, and a preservation list. Cleanup must not delete source projects, build outputs, signing material, user data, or backups.

## Compatibility resolution

Compatibility is evaluated per toolkit version and per operation. A runner is eligible only when its observed OS and architecture match a target whose status is `supported` or whose conditional requirements are satisfied. `validation-required` and `unsupported` targets must not be offered as enabled operations.

A connected device is a separate constraint from a compatible build host. A toolkit can build on x64 while flashing only through an ARM64 runner that owns the USB device. The controller must join toolkit version compatibility, runner health, device transport, active device probe, and operator policy before it creates an execution plan.

## State semantics

- `available`: the installer/adapter exists, has passed its version-specific tests and may be offered subject to approval.
- `partial`: an adapter exists but a required version guard or lifecycle stage is not yet complete. Do not advertise the incomplete operation as fully enabled.
- `planned`: catalog contract exists; implementation is not yet executable.
- `unsupported`: explicitly blocked for this version/target.

Toolkit and version `state` is not proof that a machine has the toolkit installed. Installation state is machine-specific and must be reported by the runner after verifying the actual executable version and installation manifest.

## Initial toolkit profiles

### Espressif ESP-IDF

Initial pilot profile: ESP-IDF `5.5.6`, previously used in successful firmware builds. Linux ARM64 and Linux x64 are build-host targets. A USB descriptor identifies a transport/interface, not the exact chip; flash and readback require an active `esptool` chip probe. The separately requested ESP-IDF `6.4` profile is retained as `blocked`: no official upstream v6.4 release or validated installer has been verified. Do not substitute another release or offer v6.4 for install/build/flash until Espressif publishes it and Main{Create} validates it.

Flash readback is conditional. Secure Boot, Flash Encryption, read protection and chip-specific settings can make a raw readback unavailable or unusable as a restore image. Backups must include chip identity, flash size, partition metadata, security observations, SHA-256 and provenance. Restore requires an exact compatible target and explicit approval.

The existing `firmware.esp_idf.build` adapter is only **partial** for this contract: it verifies a pinned project checkout but does not yet enforce that the installed `idf.py` matches the marketplace-selected version. Version enforcement must be implemented before build is marked available for a selected profile.

### Android SDK and device tooling

Initial Android build profile pins command-line tools revision `15859902`, Platform-Tools `37.0.1`, Build-Tools `36.0.0`, Android API `36`, and JDK `17` as a baseline. The project Gradle Wrapper and Android Gradle Plugin versions remain project-pinned and must pass their compatibility check.

The initial Linux build host is x64 only. Google documents that Android Studio for Linux does not support ARM-based Linux hosts. The Pi may act as a device gateway only after the ADB/fastboot package and USB permissions are validated on ARM64.

Android operations must not promise full-device backup. Supported backup scopes are APK export, shared-storage copy and app-provided export. Arbitrary private app data and protected system partitions are not generally accessible through ADB on stock devices. Restore is limited to signed APK reinstall, shared-storage restore and app-provided import. Fastboot partition flashing is a separate high-risk operation and requires exact device/image compatibility and bootloader conditions.

## Cleanup safety

Cleanup is per toolkit version and per host. It must:

- refuse removal while a job references the version;
- display the exact files, directories and packages to be removed;
- preserve shared components still referenced by another toolkit/version;
- preserve project checkouts, build outputs, artifacts, signing keys, device backups and user data;
- require explicit approval for deletion; and
- write a cleanup audit record with removed paths and final verification.

## Sources

- ESP-IDF releases: https://github.com/espressif/esp-idf/releases
- ESP-IDF Linux installation: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/linux-setup.html
- Espressif Installation Manager releases: https://github.com/espressif/idf-im-ui/releases
- Android command-line tools: https://developer.android.com/studio
- Android Platform-Tools: https://developer.android.com/tools/releases/platform-tools
- Android Build-Tools: https://developer.android.com/tools/releases/build-tools
- Android Linux host requirements: https://developer.android.com/studio/install
