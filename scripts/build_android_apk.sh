#!/bin/bash
set -e

echo "=== Step 1: Checking Java 21 ==="
if ! command -v java >/dev/null 2>&1 || ! java -version 2>&1 | grep -q "21\."; then
    echo "Installing OpenJDK 21, wget, and unzip..."
    apt-get update
    apt-get install -y --no-install-recommends openjdk-21-jdk-headless wget unzip
fi

echo "Java version:"
java -version

export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
export ANDROID_SDK_ROOT="/app/applet/.android-sdk"
export ANDROID_HOME="/app/applet/.android-sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

echo "=== Step 2: Checking Android SDK Command-line Tools ==="
mkdir -p "$ANDROID_HOME/cmdline-tools"
if [ ! -d "$ANDROID_HOME/cmdline-tools/latest/bin" ]; then
    echo "Downloading Android Command-line Tools..."
    cd "$ANDROID_HOME"
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
    unzip -q cmdline-tools.zip -d "$ANDROID_HOME/cmdline-tools"
    mv "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    rm cmdline-tools.zip
fi

echo "=== Step 3: Accepting Android Licenses & Installing SDK Packages ==="
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1 || true

echo "=== Step 4: Configuring local.properties ==="
mkdir -p /app/applet/android
echo "sdk.dir=$ANDROID_HOME" > /app/applet/android/local.properties

echo "=== Step 5: Building Web Assets & Syncing Capacitor ==="
cd /app/applet
npm run build
npx cap sync android

echo "=== Step 6: Compiling Android Debug APK with Gradle ==="
cd /app/applet/android
chmod +x ./gradlew
./gradlew assembleDebug --no-daemon

APK_PATH="/app/applet/android/app/build/outputs/apk/debug/app-debug.apk"

echo "=== Step 7: Verifying Generated APK ==="
if [ ! -f "$APK_PATH" ]; then
    echo "ERROR: APK was not generated at $APK_PATH"
    exit 1
fi

FILE_SIZE=$(stat -c%s "$APK_PATH" 2>/dev/null || stat -f%z "$APK_PATH")
echo "Generated APK size: $FILE_SIZE bytes"

if [ "$FILE_SIZE" -le 1048576 ]; then
    echo "ERROR: APK is smaller than 1 MB ($FILE_SIZE bytes)"
    exit 1
fi

echo "Testing APK zip structure..."
unzip -t "$APK_PATH" | head -n 25

echo "=== Step 8: Copying APK to required output paths ==="
mkdir -p /app/applet/.build-outputs
mkdir -p /app/applet/APK_DOWNLOAD

cp -f "$APK_PATH" /app/applet/.build-outputs/app-debug.apk
cp -f "$APK_PATH" /app/applet/APK_DOWNLOAD/app-debug.apk

echo "=== Final Verification ==="
ls -lh /app/applet/.build-outputs/app-debug.apk
ls -lh /app/applet/APK_DOWNLOAD/app-debug.apk
echo "SUCCESS: Debug APK built and verified successfully!"
