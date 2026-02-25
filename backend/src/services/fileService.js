const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
// const ApiResponse = require('../utils/response');
const { FILE_UPLOAD } = require('../utils/constants');

class FileService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), config.UPLOAD_DIR);
    this.ensureUploadDirectory();
  }

  async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file, subdirectory) {
    try {
      const dir = path.join(this.uploadDir, subdirectory);
      await fs.mkdir(dir, { recursive: true });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
      const filepath = path.join(dir, filename);

      await fs.writeFile(filepath, file.buffer);
      return filename;
    } catch (error) {
      throw new Error(`Error saving file: ${error.message}`);
    }
  }

  async deleteFile(filename, subdirectory) {
    try {
      const filepath = path.join(this.uploadDir, subdirectory, filename);
      await fs.unlink(filepath);
    } catch (error) {
      console.error(`Error deleting file: ${error.message}`);
    }
  }

  async getFileStream(filename, subdirectory) {
    try {
      const filepath = path.join(this.uploadDir, subdirectory, filename);
      return fs.readFile(filepath);
    } catch (error) {
      throw new Error(`Error reading file: ${error.message}`);
    }
  }

  validateFile(file) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      throw new Error(`File size exceeds ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB limit`);
    }

    if (!FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only PDF files are allowed');
    }
  }
}

module.exports = new FileService(); 