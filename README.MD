# android-version-action v1.3
Override your android version number and version code through github actions

## Usage

```yaml
- uses: DoubleSymmetry/android-version-actions@v1.3
  with:
    gradlePath: app/build.gradle # or app/build.gradle.kts

    # versionCode
    # ex. 10
    # If versionCode is not set, auto-increment versionCode.
    versionCode: ${{github.run_number}}

    # versionName
    # ex. 3.2.0
    # If versionName is not set, the version does not be changed.
    versionName: ''
```

## Examples

### auto increment build number
```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8
      - name: Bump version
        uses: DoubleSymmetry/android-version-actions@v1.3
        with:
          gradlePath: app/build.gradle # or app/build.gradle.kts 
          versionName: 1.0.0
```

### specify build number using GITHUB_RUN_NUMBER
```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8
      - name: Bump version
        uses: DoubleSymmetry/android-version-actions@v1.3
        with:
          gradlePath: app/build.gradle # or app/build.gradle.kts 
          versionCode: ${{github.run_number}}
          versionName: 1.0.0
```
