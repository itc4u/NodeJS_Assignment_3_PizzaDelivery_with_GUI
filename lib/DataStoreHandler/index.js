/**
 * Library for storing and editing data
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const promisfy = require("util").promisify;
const parseJsonToObject = require("../Helper").parseJsonToObject;

/**
 * Class Lib - handles fs I/O
 * All methods upon calling should be surrounded by try/catch otherwise promise rejections will be unhandled
 */
class Lib {

    constructor(){
        // Base directory of the data folder
        this.baseDir = path.join(__dirname, "/../../.data/");
        this.fsOpen = promisfy(fs.open);
        this.fsWriteFile = promisfy(fs.writeFile);
        this.fsClose = promisfy(fs.close);
        this.fsReadFile = promisfy(fs.readFile);
        this.fsTruncate = promisfy(fs.truncate);
        this.fsUnlink = promisfy(fs.unlink);
        this.fsReadDir = promisfy(fs.readdir);
    }

    /**
     * Verify if a given token id is currently valid for a given user
     * @param id
     * @param email
     * @return {Promise<boolean>}
     */
    async verifyToken (id, email) {
        if (id === false) return false;
        // Lookup the token
        try {
            const tokenData = await this.read("tokens", id);
            // Check that the token is for the given user and has not expired
            return tokenData["email"] === email && tokenData.expires > Date.now();
        } catch (e) {
            return false;
        }
    }

    /**
     * Write data to a file, return false if no error; otherwise return error strings
     * @param dir
     * @param file
     * @param data
     * @returns {Promise<Boolean|String>}
     */
    async create(dir, file, data) {
        const fd = await this.fsOpen(`${this.baseDir}${dir}/${file}.json`, "wx");
        const stringData = JSON.stringify(data);
        await this.fsWriteFile(fd, stringData);
        await this.fsClose(fd);
        return false;
    }

    /**
     * Read data from a file, return the read data if no error; otherwise return the error message
     * @param dir
     * @param file
     * @returns {Promise<Object | string>}
     */
    async read(dir, file) {
        const rawData = await this.fsReadFile(`${this.baseDir}${dir}/${file}.json`, "utf-8");
        if (!rawData) throw "Error : Trying to read an empty file (no JSON detected)";
        return parseJsonToObject(rawData);
    }

    /**
     * Update data inside a file, return false if no error; otherwise return the error string
     * @param dir
     * @param file
     * @param data
     * @returns {Promise<Boolean | String>}
     */
    async update(dir, file, data) {
        const fd = await this.fsOpen(`${this.baseDir}${dir}/${file}.json`, "r+");
        const stringData = JSON.stringify(data);
        await this.fsTruncate(fd);
        await this.fsWriteFile(fd, stringData);
        await this.fsClose(fd);
        return false;
    }

    /**
     * Delete a file, return false if no error; otherwise return the error string
     * @param dir
     * @param file
     * @returns {Promise<Boolean | String>}
     */
    async delete(dir, file) {
        await this.fsUnlink(`${this.baseDir}${dir}/${file}.json`);
        return false;
    }

    /**
     * List the contents of a subdirectory inside ".data" folder. Directory paths are prefixed by path to ".data" by default.
     * @param dir - relative path or the name of the intended directory to look for
     * @return {Promise<Uint8Array>} - return an array of filename (can be empty) if no error occurs (resolve); otherwise return the error string (reject/throw)
     */
    async list(dir) {
        const data = await this.fsReadDir(`${this.baseDir}${dir}/`);
        return data.map(filename => filename.trim().replace(".json", "")).filter(filename => !filename.startsWith("."));
    }

}

// Export the module
module.exports = new Lib();