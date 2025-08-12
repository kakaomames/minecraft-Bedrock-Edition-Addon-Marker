from flask import Flask, request, jsonify
import requests
import base64
import os
from flask import Flask, request
from flask_cors import CORS


#っbhbhbふhjんjn
app = Flask(__name__)
CORS(app) # これだけで、すべてのオリジンからのリクエストを許可します
# GitHub APIのベースURL
GITHUB_API_URL = "https://api.github.com"
# Vercelの環境変数からトークンを取得
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
# リポジトリの所有者とリポジトリ名
REPO_OWNER = "kakaomames"
REPO_NAME = "minecraft-Bedrock-Edition-Addon-Marker"
DATA_PATH = "ad/game/data"

@app.route("/git", methods=["POST"])
def save_to_github():
    """
    POSTリクエストを受け取り、ゲームデータをGitHubリポジトリに保存する。
    """
    # トークンが設定されていない場合はエラーを返す
    if not GITHUB_TOKEN:
        return jsonify({"error": "GitHub token not set"}), 500

    data = request.json
    username = data.get("username")
    game_data = data.get("gameData")

    if not username or not game_data:
        return jsonify({"error": "Username or gameData is missing"}), 400

    file_path = f"{DATA_PATH}/{username}.json"
    message = f"Update game data for {username}"

    # GitHub APIのエンドポイント
    url = f"{GITHUB_API_URL}/repos/{REPO_OWNER}/{REPO_NAME}/contents/{file_path}"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        # まずファイルがすでに存在するか確認
        response = requests.get(url, headers=headers)
        sha = None
        if response.status_code == 200:
            sha = response.json()["sha"]

        # データをbase64でエンコード
        content = base64.b64encode(game_data.encode('utf-8')).decode('utf-8')

        payload = {
            "message": message,
            "content": content,
            "sha": sha
        }

        # GitHubにファイルをコミット
        commit_response = requests.put(url, headers=headers, json=payload)

        if commit_response.status_code in [200, 201]:
            return jsonify({"message": "File saved to GitHub successfully"}), 200
        else:
            return jsonify({"error": "Failed to save file to GitHub", "details": commit_response.json()}), commit_response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
