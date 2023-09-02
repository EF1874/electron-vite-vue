import { PythonShell } from 'python-shell';
import { join,resolve } from 'path';

const options = {
    mode: 'text' as const,
    pythonPath: join(
        resolve(),
        'electron/env/python',
        process.platform,
        'python.exe'
    ), // Python 解释器的路径
    pythonOptions: ['-u'], // 解释器选项
    scriptPath: join(resolve(), 'electron/py-scripts/base'), // Python 脚本的路径
    args: [] // 传递给 Python 脚本的参数
};

export const pyRun = async () => {
    await PythonShell.run('hello.py', options)
        .then((res) => {
            console.log('Done', res);
        })
        .catch((err) => {
            console.log(err);
        });
};
