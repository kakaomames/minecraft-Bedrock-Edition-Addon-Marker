import { parseMinecraftModel } from './json-parser.js';
import { addModelToScene } from './3d-display.js';
import { generateTextureFromModel } from './texture-generator.js';

let loadedJsonData = null;

// ファイル選択時のイベントリスナー
document.getElementById('file-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            loadedJsonData = data; // 読み込んだJSONデータを保存

            // モデルを表示する
            const model = parseMinecraftModel(data);
            addModelToScene(model);

            alert('モデルファイルが読み込まれました。');
        } catch (error) {
            alert('ファイルの解析に失敗しました。Minecraftのモデルファイル(.json)か確認してください。\nエラー: ' + error);
        }
    };
    reader.readAsText(file);
});

// テクスチャ生成ボタンのイベントリスナー
document.getElementById('generate-texture-btn').addEventListener('click', () => {
    if (!loadedJsonData) {
        alert('先にモデルファイル(.json)を読み込んでください。');
        return;
    }

    // テクスチャを生成
    const textureDataURL = generateTextureFromModel(loadedJsonData, 16, 16);

    // ダウンロードリンクを作成
    const downloadLink = document.getElementById('download-link');
    downloadLink.href = textureDataURL;
    downloadLink.download = 'model_texture.png'; // ダウンロード時のファイル名
    downloadLink.textContent = '生成されたテクスチャをダウンロード';
    downloadLink.style.display = 'block';

    alert('テクスチャが生成されました。ダウンロードリンクをクリックして保存してください。');
});
