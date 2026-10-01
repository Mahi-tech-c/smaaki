import fs from 'fs';
import { menuItems } from './src/data/menu.js';

const generateMarkdown = () => {
  let md = "# Image Naming Guide\n\n";
  md += "To add your own photos for the menu items, please save each photo in the `public` folder using the exact filenames listed below. The filenames are automatically generated from the item name (lowercased, with spaces replaced by hyphens).\n\n";
  md += "| Category | Menu Item Name | Suggested Image Filename |\n";
  md += "|---|---|---|\n";
  
  menuItems.forEach(item => {
    // Generate suggested filename
    const filename = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
    md += `| ${item.category} | ${item.name} | \`${filename}\` |\n`;
  });
  
  fs.writeFileSync('./image_naming_guide.md', md);
  console.log("Artifact written to image_naming_guide.md");
}

generateMarkdown();
