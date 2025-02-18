#!/bin/bash

# Check if in WSL and use 7z if available in Windows
if grep -qi microsoft /proc/version; then
    ZIP_CMD="7z.exe a -tzip"
else
    # Check if zip is installed
    if ! command -v zip &> /dev/null; then
        echo "Error: zip is not installed"
        echo "Please install zip first:"
        echo "  For Ubuntu/Debian: sudo apt-get install zip"
        echo "  For Mac: brew install zip"
        echo "  For Windows (Git Bash): pacman -S zip"
        exit 1
    fi
    ZIP_CMD="zip -r"
fi

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
TEMP_DIR="temp_package"
ZIP_NAME="text-highlighter-v$VERSION.zip"

# Create clean temp directory
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR/images

# List of files to include
FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "errorTracker.js"
    "welcome.html"
    "README.md"
    "PRIVACY.md"
    "LICENSE"
)

# Copy each file
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$TEMP_DIR/"
    else
        echo "Warning: File not found: $file"
    fi
done

# Copy image files
if [ -d "images" ]; then
    cp images/*.png "$TEMP_DIR/images/"
else
    echo "Warning: Images directory not found"
    exit 1
fi

# Create zip file
cd $TEMP_DIR
$ZIP_CMD "../$ZIP_NAME" ./*
cd ..

# Clean up
rm -rf $TEMP_DIR

echo "Package created: $ZIP_NAME" 