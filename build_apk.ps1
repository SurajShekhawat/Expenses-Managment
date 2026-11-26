$ErrorActionPreference = "Stop"

$JAVA_HOME = "C:\Program Files\Java\jdk-26.0.1"
$env:JAVA_HOME = $JAVA_HOME
$env:PATH = "$JAVA_HOME\bin;$env:PATH"

$ANDROID_SDK = "C:\Users\Suraj Shekhawat\AppData\Local\Android\Sdk"
$BUILD_TOOLS = "$ANDROID_SDK\build-tools\34.0.0"
$PLATFORM = "$ANDROID_SDK\platforms\android-34\android.jar"

$AAPT2 = "$BUILD_TOOLS\aapt2.exe"
$D8 = "$BUILD_TOOLS\d8.bat"
$ZIPALIGN = "$BUILD_TOOLS\zipalign.exe"
$APKSIGNER = "$BUILD_TOOLS\apksigner.bat"

$ROOT = "d:\idea\android_build"
$BIN = "$ROOT\bin"
$OBJ = "$ROOT\obj"
$GEN = "$ROOT\gen"

Write-Host "--- 1. Cleaning and preparing directories ---"
Remove-Item -Recurse -Force $BIN, $OBJ, $GEN -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $BIN, $OBJ, $GEN | Out-Null
New-Item -ItemType Directory -Force -Path "$OBJ\compiled_res" | Out-Null

Write-Host "--- 2. Compiling resources with aapt2 ---"
& $AAPT2 compile --dir "$ROOT\res" -o "$OBJ\compiled_res.zip"

Write-Host "--- 3. Linking resources with aapt2 ---"
& $AAPT2 link `
    -I $PLATFORM `
    --manifest "$ROOT\AndroidManifest.xml" `
    --java $GEN `
    -o "$BIN\unaligned_res.apk" `
    --auto-add-overlay `
    "$OBJ\compiled_res.zip"

Write-Host "--- 4. Compiling Java sources ---"
$javaFiles = Get-ChildItem -Path "$ROOT\src", $GEN -Filter "*.java" -Recurse | ForEach-Object { $_.FullName }
& javac -source 8 -target 8 -bootclasspath $PLATFORM -d $OBJ $javaFiles

Write-Host "--- 5. Converting bytecode to Dalvik dex (d8) ---"
$classFiles = Get-ChildItem -Path $OBJ -Filter "*.class" -Recurse | ForEach-Object { $_.FullName }
& $D8 --lib $PLATFORM --output $BIN $classFiles

Write-Host "--- 6. Adding classes.dex to APK ---"
Copy-Item "$BIN\unaligned_res.apk" "$BIN\unaligned.apk"
$dexPath = "$BIN\classes.dex"
# Using jar/zip tool from JDK to add classes.dex into APK zip
Set-Location $BIN
& jar uf "$BIN\unaligned.apk" "classes.dex"
Set-Location "d:\idea"

Write-Host "--- 7. Aligning APK with zipalign ---"
& $ZIPALIGN -f -p 4 "$BIN\unaligned.apk" "$BIN\aligned.apk"

Write-Host "--- 8. Generating production keystore and signing APK ---"
$KEYSTORE = "$ROOT\fingroww-release.keystore"
$KEYSTORE_PASS = "FinGroww@Release2026"
$ALIAS = "fingroww"

if (-not (Test-Path $KEYSTORE)) {
    Write-Host "Generating official 10,000-day production release keystore..."
    & keytool -genkeypair -v `
        -keystore $KEYSTORE `
        -storepass $KEYSTORE_PASS `
        -alias $ALIAS `
        -keypass $KEYSTORE_PASS `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -dname "CN=FinGroww Financial, OU=App Engineering, O=FinGroww Technologies, L=Jaipur, ST=Rajasthan, C=IN"
}

$FINAL_APK = "d:\idea\FinGroww.apk"
& $APKSIGNER sign `
    --ks $KEYSTORE `
    --ks-pass pass:$KEYSTORE_PASS `
    --ks-key-alias $ALIAS `
    --key-pass pass:$KEYSTORE_PASS `
    --v1-signing-enabled true `
    --v2-signing-enabled true `
    --v3-signing-enabled true `
    --out $FINAL_APK `
    "$BIN\aligned.apk"

Write-Host "--- 9. Verifying signed APK ---"
& $APKSIGNER verify $FINAL_APK

Write-Host "SUCCESS: APK generated at $FINAL_APK"
Get-Item $FINAL_APK | Select-Object Name, Length, LastWriteTime
