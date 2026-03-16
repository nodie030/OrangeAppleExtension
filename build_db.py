import os
import sys
import json

db_dir = r"C:\Users\User\.gemini\antigravity\scratch\OrangeAppleAssistant"
sys.path.append(db_dir)

import db

# Extract all list variables from db.py
db_dict = {k: v for k, v in vars(db).items() if isinstance(v, list) and not k.startswith("__")}

out = ["export const dbData = " + json.dumps(db_dict, ensure_ascii=False, indent=2) + ";"]

out.append("""
export function getCourseDetailsByText(courseText) {
    if (!courseText) return { name: "未知課程", topic: "（未找到課程內容）", number: 1 };
    
    let category = "未知課程";
    let listName = null;
    let textUpper = courseText.toUpperCase();
    
    if (textUpper.includes("HTML")) { category = "HTML5"; listName = "HTML"; }
    else if (textUpper.includes("PYTHON") && textUpper.includes("2")) { category = "Python 進階"; listName = "Python2"; }
    else if (textUpper.includes("PYTHON")) { category = "Python"; listName = "Python"; }
    else if (textUpper.includes("SCRATCH") && textUpper.includes("1")) { category = "Scratch 進階"; listName = "Scratch1"; }
    else if (textUpper.includes("SCRATCH")) { category = "Scratch"; listName = "Scratch0"; }
    else if (textUpper.includes("JAVASCRIPT") && textUpper.includes("NEW")) { category = "JavaScript 進階"; listName = "JavaScript_New"; }
    else if (textUpper.includes("JAVASCRIPT")) { category = "JavaScript"; listName = "JavaScript"; }
    else if (textUpper.includes("DB") || textUpper.includes("資料庫")) { category = "資料庫與 SQL"; listName = "DB"; }
    else if (textUpper.includes("ALGORITHM") || textUpper.includes("演算法")) { category = "演算法與邏輯"; listName = "Algorithm"; }
    else if (textUpper.includes("AI") || textUpper.includes("人工智慧")) { category = "AI"; listName = "AI"; }

    let numberMatch = courseText.match(/(?:Lesson|L)\\s*(\\d+)/i);
    let number = 1;
    if (numberMatch && numberMatch[1]) {
        number = parseInt(numberMatch[1], 10);
        // 若超過15，則取15的餘數，確保15的倍數維持15 (如 17->2, 30->15, 35->5)
        if (number > 15) {
            number = number % 15;
            if (number === 0) number = 15;
        }
    }
    
    let topic = "（未找到課程內容）";
    if (listName && typeof dbData !== 'undefined' && dbData[listName]) {
        let list = dbData[listName];
        let idx = number - 1;
        if (idx >= 0 && idx < list.length) {
            topic = list[idx];
        } else if (list.length > 0) {
            topic = list[list.length - 1]; //Fallback
        }
    }
    
    return { name: category, topic: topic, number: number };
}
""")

with open(r"C:\Users\User\.gemini\antigravity\scratch\OrangeAppleExtension\db.js", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
