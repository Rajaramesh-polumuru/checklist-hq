#!/bin/bash

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🚀 Pushing migrations to Supabase..."

# Check if we are in the project root
if [ ! -d "supabase" ]; then
    echo "❌ Error: 'supabase' directory not found. Please run this script from the project root."
    exit 1
fi

# Try to find the Supabase CLI
if command_exists supabase; then
    echo "✅ Using system 'supabase' CLI"
    supabase db push
elif [ -f "./node_modules/.bin/supabase" ]; then
    echo "✅ Using local 'node_modules' Supabase CLI"
    ./node_modules/.bin/supabase db push
else
    echo "⚠️  Supabase CLI not found in PATH or node_modules."
    echo "🔄 Attempting to run via 'npx supabase'..."
    npx supabase db push
fi

if [ $? -eq 0 ]; then
    echo "✅ Migrations pushed successfully!"
else
    echo "❌ Failed to push migrations."
    exit 1
fi
