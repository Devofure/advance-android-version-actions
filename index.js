const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

// versionCode — A positive integer [...] -> https://developer.android.com/studio/publish/versioning
const versionCodeRegexPattern = /(versionCode(?:\s|=)*)(.*)/;
// versionName — A string used as the version number shown to users [...] -> https://developer.android.com/studio/publish/versioning
const versionNameRegexPattern = /(versionName(?:\s|=)*)(.*)/;

try {
    const gradlePath = core.getInput('gradlePath');
    const versionCode = core.getInput('versionCode');
    const versionName = core.getInput('versionName');
    const versionStage = core.getInput('versionStage');


    console.log(`Gradle Path : ${gradlePath}`);
    console.log(`Version Code : ${versionCode}`);
    console.log(`Version Name : ${versionName}`);
    console.log(`Version stage : ${versionStage}`);

    fs.readFile(gradlePath, 'utf8', function (err, data) {
        newGradle = data;
        if (versionCode.length > 0) {
            console.log(`Trying to override version code ${versionCode}`)
            newGradle = newGradle.replace(versionCodeRegexPattern, `$1${versionCode}`);
        }
        else {
            const lastVersionCodeStr = newGradle.match(versionCodeRegexPattern)[2];
            const newVersionCode = parseInt(lastVersionCodeStr) + 1;
            newGradle = newGradle.replace(versionCodeRegexPattern, `$1${newVersionCode}`);
        }

        if (versionName.length > 0) {
            if (versionStage.length > 0) {
                currentVersionCode = newGradle.match(versionCodeRegexPattern)[2];
                const newVersion = versionName + "-" + versionStage + "." + currentVersionCode
                console.log(`Trying to override version name ${newVersion}`)
                newGradle = newGradle.replace(versionNameRegexPattern, `$1\"${newVersion}\"`);
            } else {
                console.log(`Trying to override version name ${versionName}`)
                newGradle = newGradle.replace(versionNameRegexPattern, `$1\"${versionName}\"`);
            }
        }

        fs.writeFile(gradlePath, newGradle, function (err) {
            if (err) throw err;
            console.log(`Successfully override the file`)
            core.setOutput("result", `Done`);
        });
    });

} catch (error) {
    core.setFailed(error.message);
}
