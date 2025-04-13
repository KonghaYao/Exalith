import ast


def transform_top_level_imports(code_string):
    """
    将 Python 代码字符串中的所有顶层导入语句移入 main 函数中。

    Args:
        code_string: 包含 Python 代码的字符串。

    Returns:
        转换后的 Python 代码字符串。
    """
    tree = ast.parse(code_string)
    imports = []
    main_code = []
    other_code = []

    # 分离导入语句、main函数和其他代码
    for node in tree.body:
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            imports.append(node)
        elif isinstance(node, ast.FunctionDef) and node.name == "main":
            main_code = [ast.unparse(node)]
        else:
            other_code.append(ast.unparse(node))

    # 构建新的代码字符串
    result = []

    # 添加导入语句到 main 函数中
    if main_code:
        main_lines = main_code[0].split("\n")
        new_main_lines = []
        for line in main_lines:
            new_main_lines.append(line)
            if line.strip().startswith("def main("):
                # 在 main 函数定义后添加导入语句
                new_main_lines.append("    # 导入语句")
                for node in imports:
                    new_main_lines.append(f"    {ast.unparse(node)}")
        result.append("\n".join(new_main_lines))
    else:
        # 如果没有 main 函数，创建一个新的
        result.append("def main(df):")
        result.append("    # 导入语句")
        for node in imports:
            result.append(f"    {ast.unparse(node)}")

    # 添加其他代码
    result.extend(other_code)

    return "\n".join(result)


def run_python_code(python_code, exec_globals, exec_locals):
    result_code = transform_top_level_imports(python_code)
    # print(result_code)
    return exec(result_code, exec_globals, exec_locals)


# 写个测试
if __name__ == "__main__":
    python_code = """import pandas as pd
def main(df):
    # 将 commentlist 列的空值填为 '[]'
    df['commentlist'] = df['commentlist'].fillna('[]')
    # 尝试将 price 列转为数值列，并处理非法转换
    df['price'] = pd.to_numeric(df['price'], errors='coerce')
    # 将 star 列转为数值列，并处理非法转换
    df['star'] = pd.to_numeric(df['star'], errors='coerce')
    # 将 comment 列转为数值列，并处理非法转换
    df['comment'] = pd.to_numeric(df['comment'], errors='coerce')
    return df
main(__import__('pandas').DataFrame({'commentlist': [None, '[]', '[]'], 'price': [100, 200, 300], 'star': [4.5, 4.0, 4.2], 'comment': [10, 20, 30]}))
    """
    exec_globals = {}
    exec_locals = {}
    result = run_python_code(python_code, exec_globals, exec_locals)
    print(result)
