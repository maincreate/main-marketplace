# Main{Create} marketplace

The official builder catalog contains versioned SDK and toolkit profiles in `registry/toolkits.json` and hardware-to-SDK compatibility in `registry/microcontrollers.json`. The toolkit catalog is validated against `schemas/toolkits.schema.json`.

[main-platform](https://github.com/maincreate/main-platform) pins a catalog revision and loads the vendored JSON. Execution policy, compatibility resolution, approval and capability definitions belong to the platform. Reviewed installers, build/flash/backup/restore adapters and cleanup executors belong to [main-builders](https://github.com/maincreate/main-builders).

## Toolkit lifecycle

Every toolkit version declares:

- exact version and upstream provenance;
- supported OS/architecture combinations for install, build, flash, backup and restore independently;
- device families, transports and identity-probe requirements;
- install, build, flash, backup, restore and cleanup recipe/capability references;
- limitations, approval requirements and cleanup preservation rules.

Marketplace data is declarative. It must never contain shell commands, executable hooks or arbitrary scripts. A catalog reference does not make an operation executable: the platform must expose a reviewed capability and the builders repository must provide a tested adapter.

See [Versioned toolkit lifecycle](docs/toolkit-lifecycle.md) for the contract and the initial Espressif and Android profiles.
