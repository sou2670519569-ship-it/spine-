const fs = require("fs");
const path = require("path");

/****************************************
 * 仓库根目录
 ****************************************/

const ROOT = ".";

/****************************************
 * 输出文件
 ****************************************/

const OUTPUT = "manifest.json";

/****************************************/

const result = [];

/****************************************
 * 忽略目录
 ****************************************/

const IGNORE_DIRS = new Set([
    ".git",
    "node_modules",
    ".github"
]);

/****************************************
 * 扫描目录
 ****************************************/

function scan(dir){

    let files = [];

    try{

        files =
        fs.readdirSync(dir);

    }catch(err){

        console.error("读取目录失败:",dir);

        return;
    }

    const jsonFiles = [];
    const skelFiles = [];
    const atlasFiles = [];

    /************************************
     * 当前目录
     ************************************/

    for(const file of files){

        if(IGNORE_DIRS.has(file))
            continue;

        const full =
        path.join(dir,file);

        let stat;

        try{

            stat =
            fs.statSync(full);

        }catch(err){

            continue;
        }

        /********************************
         * 子目录
         ********************************/

        if(stat.isDirectory()){

            scan(full);

            continue;
        }

        const lower =
        file.toLowerCase();

        /********************************
         * 分类
         ********************************/

        if(lower.endsWith(".json")){

            jsonFiles.push(file);
        }

        else if(lower.endsWith(".skel")){

            skelFiles.push(file);
        }

        else if(lower.endsWith(".atlas")){

            atlasFiles.push(file);
        }
    }

    /************************************
     * json skeleton
     ************************************/

    for(const json of jsonFiles){

        const name =
        json.replace(/\.json$/i,"");

        /********************************
         * atlas匹配
         ********************************/

        let atlas =
        atlasFiles.find(v=>{

            return (
                v.startsWith(name)
            );
        });

        if(!atlas){

            atlas =
            atlasFiles[0] || null;
        }

        /********************************
         * 读取版本
         ********************************/

        let version = "4.2";

        try{

            const fullPath =
            path.join(dir,json);

            const text =
            fs.readFileSync(
                fullPath,
                "utf8"
            );

            const match =
            text.match(
                /"spine"\s*:\s*"([^"]+)"/
            );

            if(match){

                version =
                match[1];
            }

        }catch(err){

            console.error(
                "读取json版本失败:",
                json
            );
        }

        result.push({

            name,

            path:
            dir.replace(/\\/g,"/"),

            json,

            skel:null,

            atlas,

            version
        });
    }

    /************************************
     * skel skeleton
     ************************************/

    for(const skel of skelFiles){

        const name =
        skel.replace(/\.skel$/i,"");

        /********************************
         * atlas匹配
         ********************************/

        let atlas =
        atlasFiles.find(v=>{

            return (
                v.startsWith(name)
            );
        });

        if(!atlas){

            atlas =
            atlasFiles[0] || null;
        }

        /********************************
         * skel版本
         ********************************/

        let version = "4.2";

        try{

            const buffer =
            fs.readFileSync(
                path.join(dir,skel)
            );

            /****************************
             * 只读取前200字节
             ****************************/

            const text =
            buffer.toString(
                "utf8",
                0,
                200
            );

            const match =
            text.match(
                /\d+\.\d+\.\d+/
            );

            if(match){

                version =
                match[0];
            }

        }catch(err){

            console.error(
                "读取skel版本失败:",
                skel
            );
        }

        result.push({

            name,

            path:
            dir.replace(/\\/g,"/"),

            json:null,

            skel,

            atlas,

            version
        });
    }
}

/****************************************
 * 开始
 ****************************************/

console.log("开始扫描...");

scan(ROOT);

/****************************************
 * 去重
 ****************************************/

const unique = [];

const map = new Set();

for(const item of result){

    const key =
    item.path + "/" + item.name;

    if(map.has(key))
        continue;

    map.add(key);

    unique.push(item);
}

/****************************************
 * 排序
 ****************************************/

unique.sort((a,b)=>{

    return (
        a.path + "/" + a.name
    ).localeCompare(
        b.path + "/" + b.name
    );
});

/****************************************
 * 输出
 ****************************************/

fs.writeFileSync(

    OUTPUT,

    JSON.stringify(
        unique,
        null,
        2
    ),

    "utf8"
);

console.log("");

console.log(
    `扫描完成:
    
${unique.length} 个角色`
);

console.log("");

console.log(
    `输出文件:
    
${OUTPUT}`
);