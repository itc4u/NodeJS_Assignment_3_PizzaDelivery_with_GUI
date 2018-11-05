const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const promisfy = require("util").promisify;

/**
 * This is a library for storing and rotating logs
 */
class Logs {

    constructor() {
        this.baseDir = path.join(__dirname, "/../../.logs/");
        this.fsOpen = promisfy(fs.open);
        this.fsWriteFile = promisfy(fs.writeFile);
        this.fsClose = promisfy(fs.close);
        this.fsReadFile = promisfy(fs.readFile);
        this.fsTruncate = promisfy(fs.truncate);
        this.fsAppendFile = promisfy(fs.appendFile);
        this.fsReadDir = promisfy(fs.readdir);
        this.gzip = promisfy(zlib.gzip);
        this.unzip = promisfy(zlib.unzip);
    }

    // Append a string to a file. Create the file if it does not exist.
    async append(file, str) {
        const fd = await this.fsOpen(`${this.baseDir}${file}.log`, "a");
        await this.fsAppendFile(fd, str+"\n");
        await this.fsClose(fd);
        return false;
    }

    /**
     * List all the logs (can be an empty array) and optionally include the compressed logs
     * @param includeCompressedLogs {boolean}
     * @return {Promise<Uint8Array>} - it throws if error otherwise return array
     */
    async list(includeCompressedLogs) {
        let data = await this.fsReadDir(this.baseDir);
        data = data.filter(name => !name.startsWith("."));
        if (!includeCompressedLogs) {
            data = data.filter(name => !name.endsWith(".gz.b64"))
        }
        data = data.map(name => name.replace(".log", "")).map(name => name.replace(".gz.b64", ""));
        return data;
    }

    /**
     * Compress the contents of one .log file into a .gz.b64 file within the same directory
     * @param logId - the file to compress
     * @param newFileId - the compressed file as result
     * @return {Promise<boolean | string>} - false if no error; otherwise return error string
     */
    async compress(logId, newFileId) {
        const sourceFile = logId+".log";
        const destFile = newFileId+".gz.b64";
        const inputString = await this.fsReadFile(`${this.baseDir}${sourceFile}`, "utf8");
        const buffer = await this.gzip(inputString);
        const fd = await this.fsOpen(`${this.baseDir}${destFile}`, "wx");
        await this.fsWriteFile(fd, Buffer.from(buffer).toString("base64"));
        await this.fsClose(fd);
        return false;
    }

    /**
     * Decompress the contents of a .gz.b64 file into a string variable
     * @param fileId
     * @return {Promise<Object>} - {error:boolean, value:boolean|string}
     */
    async decompress(fileId) {
        const filename = fileId+".gz.b64";
        const result = {
            error : false,
            value : false
        };
        const str = await this.fsReadFile(`${this.baseDir}${filename}`, "utf8");
        const inputBuffer = Buffer.from(str, "base64");
        const outputBuffer = await this.unzip(inputBuffer);
        result.value = outputBuffer.toString();
        return result;
    }

    async truncate(logId) {
        await this.fsTruncate(`${this.baseDir}${logId}.log`, 0,);
        return false;
    }

}

module.exports = new Logs();