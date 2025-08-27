#!/bin/bash

# Deploy with SEO Optimization Script
# SEO最適化を含むデプロイスクリプト

echo "🚀 Starting SEO-optimized deployment..."

# 1. Enhanced sitemap generation
echo "📄 Generating enhanced sitemaps..."
npm run generate-sitemap:enhanced

# 2. Build the application
echo "🏗️ Building application..."
npm run build

# 3. Copy SEO configuration files to dist
echo "📋 Copying SEO config files..."
cp public/_headers dist/_headers
cp public/_redirects dist/_redirects
cp public/robots.txt dist/robots.txt

# 4. Verify sitemap files exist and are valid XML
echo "✅ Verifying sitemap files..."
if [ -f "dist/sitemap.xml" ]; then
    echo "  ✓ sitemap.xml exists"
    head -n 5 dist/sitemap.xml | grep -q "<?xml" && echo "  ✓ sitemap.xml is valid XML" || echo "  ❌ sitemap.xml invalid"
else
    echo "  ❌ sitemap.xml missing"
fi

if [ -f "dist/sitemap-images.xml" ]; then
    echo "  ✓ sitemap-images.xml exists"
    head -n 5 dist/sitemap-images.xml | grep -q "<?xml" && echo "  ✓ sitemap-images.xml is valid XML" || echo "  ❌ sitemap-images.xml invalid"
else
    echo "  ❌ sitemap-images.xml missing"
fi

# 5. Verify configuration files
echo "🔧 Verifying configuration files..."
[ -f "dist/_headers" ] && echo "  ✓ _headers exists" || echo "  ❌ _headers missing"
[ -f "dist/_redirects" ] && echo "  ✓ _redirects exists" || echo "  ❌ _redirects missing"
[ -f "dist/robots.txt" ] && echo "  ✓ robots.txt exists" || echo "  ❌ robots.txt missing"

# 6. Display deployment summary
echo ""
echo "📊 Deployment Summary:"
echo "========================"
SITEMAP_URLS=$(grep -c "<loc>" dist/sitemap.xml 2>/dev/null || echo "0")
IMAGE_URLS=$(grep -c "<image:loc>" dist/sitemap-images.xml 2>/dev/null || echo "0")
echo "  📄 Sitemap URLs: $SITEMAP_URLS"
echo "  🖼️  Image URLs: $IMAGE_URLS"
echo "  📁 Files ready for deployment in: ./dist/"

# 7. Next steps reminder
echo ""
echo "🎯 Next Steps:"
echo "1. Deploy the ./dist/ folder to your hosting service"
echo "2. Verify https://collection.oshikatsu-guide.com/sitemap.xml returns XML"
echo "3. Submit sitemaps to Google Search Console"
echo "4. Monitor indexing status after 24-48 hours"

echo ""
echo "✅ SEO-optimized build completed!"