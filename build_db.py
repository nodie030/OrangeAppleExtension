import argparse
import importlib.util
import json
from pathlib import Path


DB_TEMPLATE = """window.dbData = __DB_JSON__;

window.getCourseDetailsByText = function(courseText) {{
    if (!courseText) return {{ name: "未知課程", topic: "（未找到課程內容）", number: 1 }};

    let category = "未知課程";
    let listName = null;
    const courseLabel = courseText.replace(/(?:Lesson|L)\\s*\\d+.*/i, '').trim();
    const courseLabelUpper = courseLabel.toUpperCase();
    const isAdvancedLabel = courseLabel.includes("進階") || /\\bADVANCED\\b/.test(courseLabelUpper);
    const isNewTrackLabel = courseLabel.includes("新版") || /\\bNEW\\b/.test(courseLabelUpper);

    if (courseLabelUpper.includes("HTML")) {{ category = "HTML5"; listName = "HTML"; }}
    else if (courseLabelUpper.includes("PYTHON") && (isAdvancedLabel || /PYTHON\\s*2\\b/.test(courseLabelUpper))) {{ category = "Python 進階"; listName = "Python2"; }}
    else if (courseLabelUpper.includes("PYTHON")) {{ category = "Python"; listName = "Python"; }}
    else if (courseLabelUpper.includes("SCRATCH") && (isAdvancedLabel || /SCRATCH\\s*1\\b/.test(courseLabelUpper))) {{ category = "Scratch 進階"; listName = "Scratch1"; }}
    else if (courseLabelUpper.includes("SCRATCH")) {{ category = "Scratch"; listName = "Scratch0"; }}
    else if (courseLabelUpper.includes("JAVASCRIPT") && (isAdvancedLabel || isNewTrackLabel)) {{ category = "JavaScript 進階"; listName = "JavaScript_New"; }}
    else if (courseLabelUpper.includes("JAVASCRIPT")) {{ category = "JavaScript"; listName = "JavaScript"; }}
    else if (courseLabelUpper.includes("DB") || courseLabel.includes("資料庫")) {{ category = "資料庫與 SQL"; listName = "DB"; }}
    else if (courseLabelUpper.includes("ALGORITHM") || courseLabel.includes("演算法")) {{ category = "演算法與邏輯"; listName = "Algorithm"; }}
    else if (courseLabelUpper.includes("AI") || courseLabel.includes("人工智慧")) {{ category = "AI"; listName = "AI"; }}

    let numberMatch = courseText.match(/(?:Lesson|L)\\s*(\\d+)/i);
    let number = 1;
    if (numberMatch && numberMatch[1]) {{
        number = parseInt(numberMatch[1], 10);
        if (number > 15) {{
            number = number % 15;
            if (number === 0) number = 15;
        }}
    }}

    let topic = "（未找到課程內容）";
    if (listName && typeof window.dbData !== 'undefined' && window.dbData[listName]) {{
        let list = window.dbData[listName];
        let idx = number - 1;
        if (idx >= 0 && idx < list.length) {{
            topic = list[idx];
        }} else if (list.length > 0) {{
            topic = list[list.length - 1];
        }}
    }}

    return {{ name: category, topic: topic, number: number }};
}};
"""


def load_source_lists(source_path: Path) -> dict:
    if source_path.suffix.lower() == ".json":
        with source_path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    else:
        spec = importlib.util.spec_from_file_location("orangeapple_db_source", source_path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"無法載入來源檔案：{source_path}")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        data = {
            key: value
            for key, value in vars(module).items()
            if isinstance(value, list) and not key.startswith("__")
        }

    if not isinstance(data, dict) or not data:
        raise RuntimeError("來源檔案中沒有可用的課程清單資料。")

    return data


def build_db_js(db_dict: dict) -> str:
    db_json = json.dumps(db_dict, ensure_ascii=False, indent=2)
    return DB_TEMPLATE.replace("__DB_JSON__", db_json)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="將課程資料來源（Python 或 JSON）轉成給 Chrome 擴充功能使用的 db.js。"
    )
    parser.add_argument("source", help="來源檔案路徑，例如 db.py 或 db.json")
    parser.add_argument(
        "output",
        nargs="?",
        default="db.js",
        help="輸出檔案路徑，預設為目前資料夾的 db.js",
    )
    args = parser.parse_args()

    source_path = Path(args.source).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    if not source_path.exists():
        raise FileNotFoundError(f"找不到來源檔案：{source_path}")

    db_dict = load_source_lists(source_path)
    output_path.write_text(build_db_js(db_dict), encoding="utf-8")
    print(f"已產生 {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
