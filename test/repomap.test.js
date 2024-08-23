const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { RepoMap } = require("../src/index"); // Adjust the import paths as necessary
const { result } = require('lodash');

describe('TestRepoMap', function() {
  

    it('test_get_repo_map', async function() {
        const testFiles = [
            "test_file1.py",
            "test_file2.py",
            "test_file3.md",
            "test_file4.json"
     
        ];

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
        try {
            testFiles.forEach(file => {
                fs.writeFileSync(path.join(tempDir, file), "");
            });

          
            const repoMap = new RepoMap(8000,tempDir);
            const otherFiles = testFiles.map(file => path.join(tempDir, file));
            const result = await repoMap.get_repo_map([], otherFiles);
            console.log(result);

            assert(result.includes("test_file1.py"));
            assert(result.includes("test_file2.py"));
            assert(result.includes("test_file3.md"));
            assert(result.includes("test_file4.json"));
        } finally {
            fs.rmSync(tempDir, { recursive: true });
        }
    });

    it('test_get_repo_map_with_identifiers', async function() {
        const testFile1 = "test_file_with_identifiers.py";
        const fileContent1 = `\
class MyClass:
    def my_method(self, arg1, arg2):
        return arg1 + arg2

def my_function(arg1, arg2):
    return arg1 * arg2
`;

        const testFile2 = "test_file_import.py";
        const fileContent2 = `\
from test_file_with_identifiers import MyClass

obj = MyClass()
print(obj.my_method(1, 2))
print(my_function(3, 4))
`;

        const testFile3 = "test_file_pass.py";
        const fileContent3 = "pass";

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
        try {
            fs.writeFileSync(path.join(tempDir, testFile1), fileContent1);
            fs.writeFileSync(path.join(tempDir, testFile2), fileContent2);
            fs.writeFileSync(path.join(tempDir, testFile3), fileContent3);

        
            const repoMap = new RepoMap(8000,tempDir);
            const otherFiles = [
                path.join(tempDir, testFile1),
                path.join(tempDir, testFile2),
                path.join(tempDir, testFile3),
            ];
            const result = await repoMap.get_repo_map([], otherFiles);
            console.log(result)

            assert(result.includes("test_file_with_identifiers.py"));
            assert(result.includes("MyClass"));
            assert(result.includes("my_method"));
            assert(result.includes("my_function"));
            assert(result.includes("test_file_pass.py"));
        } finally {
            fs.rmSync(tempDir, { recursive: true });
        }
    });

    it('test_get_repo_map_all_files', async function() {
        const testFiles = [
            "test_file0.py",
            "test_file1.txt",
            "test_file2.md",
            "test_file3.json",
            "test_file4.html",
            "test_file5.css",
            "test_file6.js",
        ];

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
        try {
            testFiles.forEach(file => {
                fs.writeFileSync(path.join(tempDir, file), "");
            });

            const repoMap = new RepoMap(8000,tempDir);
            const otherFiles = testFiles.map(file => path.join(tempDir, file));
            const result = await repoMap.get_repo_map([], otherFiles);

            testFiles.forEach(file => {
                assert(result.includes(file));
            });
        } finally {
           fs.rmSync(tempDir, { recursive: true });
        }
    });

    it('test_get_repo_map_excludes_added_files', async function() {
        const testFiles = [
            "test_file1.py",
            "test_file2.py",
            "test_file3.md",
            "test_file4.json",
        ];

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
        try {
            testFiles.forEach(file => {
                fs.writeFileSync(path.join(tempDir, file), "def foo(): pass\n");
            });

         
            const repoMap = new RepoMap(8000,tempDir);
            const testFilePaths = testFiles.map(file => path.join(tempDir, file));
            const result = await repoMap.get_repo_map(testFilePaths.slice(0, 2), testFilePaths.slice(2));
            assert(!result.includes("test_file1.py"));
            assert(!result.includes("test_file2.py"));
            assert(result.includes("test_file3.md"));
            assert(result.includes("test_file4.json"));
        } finally {
           fs.rmSync(tempDir, { recursive: true });
        }
    });
});

describe('TestRepoMapTypescript',  function() {
  

    it('test_get_repo_map_typescript', async function() {
        const testFileTs = "test_file.ts";
        const fileContentTs = `\
interface IMyInterface {
    someMethod(): void;
}

type ExampleType = {
    key: string;
    value: number;
};

enum Status {
    New,
    InProgress,
    Completed,
}

export class MyClass {
    constructor(public value: number) {}

    add(input: number): number {
        return this.value + input;
    }
}

export function myFunction(input: number): number {
    return input * 2;
}
`;

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
        try {
            fs.writeFileSync(path.join(tempDir, testFileTs), fileContentTs);

           // const io = new InputOutput();
            const repoMap = new RepoMap(8000,tempDir);
            const otherFiles = [path.join(tempDir, testFileTs)];
           let result= await repoMap.get_repo_map([], otherFiles)
                console.log(result)
                assert(result.includes("test_file.ts"));
                assert(result.includes("IMyInterface"));
                assert(result.includes("ExampleType"));
                assert(result.includes("Status"));
                assert(result.includes("MyClass"));
                assert(result.includes("add"));
                assert(result.includes("myFunction"));

            

           
        } finally {
           fs.rmSync(tempDir, { recursive: true });
        }
    });
});