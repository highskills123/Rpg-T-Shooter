#!/bin/bash
set -e

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

APK=/home/highskills/autoclicker/neon-space-shooter/apps/mobile/android/app/build/outputs/apk/release/app-release.apk
ANDROID_DIR=/home/highskills/autoclicker/neon-space-shooter/apps/mobile/android

echo ">> Building release APK..."
cd "$ANDROID_DIR"
./gradlew assembleRelease

echo ">> Installing on device..."
adb install -r "$APK"

echo ">> Pushing to GitHub..."
cd /home/highskills/autoclicker/neon-space-shooter
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "Nothing to commit"
git push

echo ">> Done! App updated on device and pushed to GitHub."
