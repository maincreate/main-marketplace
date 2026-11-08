# Main{Create} marketplace

The official builder catalog contains SDK and toolkit profiles in `registry/toolkits.json` and hardware-to-SDK compatibility in `registry/microcontrollers.json`. This initial catalog comes from TinkerTunnel commit `f25069c0d6d10e510b1eb0fcdc63862372d57687`.

[main-platform](https://github.com/maincreate/main-platform) pins a catalog revision and loads the vendored JSON. Execution policy and capability definitions belong to the platform. Approved installers and execution adapters belong to [main-builders](https://github.com/maincreate/main-builders).

Catalog entries describe requirements and compatibility. They must never carry shell commands or executable hooks. Dependency resolution, signed installation recipes, and external catalog sources are future work.
