# Devofure/android-version-actions v1.4
Override your android app version, version code and stage through github actions

Follows Semantic versioning format https://semver.org/

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
    
    # versionStage
    # ex. b for beta or a for alpha
    # the only way to remove the version stage is to set the versionName without the the versionStage
    versionStage: ''
    # versionCodeLimiter
    # ex. if the versionCodeLimiter is 3 and the android version is 20000345, the limited version code will be 345
    # The version code added to the version name after the version stage will be limited
    versionCodeLimiter: ''
    
```


{major}.{minor}.{patch}-{stage}.{version code} = 1.5.6-alpha.2000124

{major}.{minor}.{patch}-{stage}.{limited version code} = 1.5.6-alpha.124



## Examples

### auto increment version code
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
        uses: Devofure/android-version-actions@v1.4
        with:
          gradlePath: app/build.gradle # or app/build.gradle.kts 
          versionName: 1.0.0
```

### specify version code using GITHUB_RUN_NUMBER
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
        uses: Devofure/android-version-actions@v1.4
        with:
          gradlePath: app/build.gradle # or app/build.gradle.kts 
          versionCode: ${{github.run_number}}
          versionName: 1.0.0
```

### specify stage with auto increment version code
This workflow can run every night, increase android code, and change to beta-stage as default.
It is also possible to increase the version manually and select the stage.  

```yaml
name: change stage and auto increse version code
on:
  schedule:
  - cron: "0 0 * * *"
  
  workflow_dispatch:
    inputs:
      versionName:
        description: 'Version Name'
        required: false
        default: ''
      stage:
        type: choice
        description: 'The stage of the app'
        options: 
        - beta
        - alpha
        - release

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8

      - name: Bump version to Alpha
        uses: Devofure/android-version-actions@master
        if: ${{ github.event.inputs.stage == 'alpha' }}
        with:
          gradlePath: app/build.gradle
          versionName: ${{ github.event.inputs.versionName }}
          versionStage: a
          versionCodeLimiter: 3

      - name: Bump version to Beta
        uses: Devofure/android-version-actions@master
        if: ${{ github.event.inputs.stage != 'alpha' && github.event.inputs.stage != 'release' }}
        with:
          gradlePath: app/build.gradle
          versionName: ${{ github.event.inputs.versionName }}
          versionStage: b
          versionCodeLimiter: 3

      - name: Bump version to Release
        uses: Devofure/android-version-actions@master
        if: ${{ github.event.inputs.stage == 'release' }}
        with:
          gradlePath: app/build.gradle
          versionName: ${{ github.event.inputs.versionName }}
          versionStage: ' '

      - uses: EndBug/add-and-commit@v8
        with:
          add: app/build.gradle
          message: ${{steps.build_changelog.outputs.changelog}}
          default_author: github_actions
```
