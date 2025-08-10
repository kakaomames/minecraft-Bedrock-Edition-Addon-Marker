// main.js
// game.jsとutils.jsから必要な関数と変数をインポート
import { initGame, gameLoop } from './game.js';
import { exportGame, importGame, loadAddon } from './utils.js';

window.addEventListener('load', () => {
    // HTMLエレメントを取得
    const canvas = document.getElementById('gameCanvas');
    const warehouseButton = document.getElementById('warehouseButton');
    const warehouseDropdown = document.getElementById('warehouseDropdown');
    const warehouseTabBtn = document.getElementById('warehouseTabBtn');
    const marketTabBtn = document.getElementById('marketTabBtn');
    const warehouseContent = document.getElementById('warehouseContent');
    const marketContent = document.getElementById('marketContent');
    const addonButton = document.getElementById('addonButton');
    const fileUploadInput = document.getElementById('file-upload-input');
    
    // グローバルオブジェクトにイベントハンドラをアタッチ
    //これにより、HTMLのonclick属性から関数を呼び出せるようになります
    window.exportGame = exportGame;
    window.importGame = importGame;
    window.loadAddon = loadAddon;
    window.changeGame = (gameName) => {
        alert(`ゲームを '${gameName}' に切り替えます！(まだ実装されていません)`);
    };

    // game.jsで定義された初期化関数を呼び出し
    initGame(canvas);
    
    // 倉庫ボタンのクリックイベント
    warehouseButton.addEventListener('click', () => {
        warehouseDropdown.classList.toggle('active');
    });

    // タブ切り替えイベント
    warehouseTabBtn.addEventListener('click', () => {
        warehouseTabBtn.classList.add('active');
        marketTabBtn.classList.remove('active');
        warehouseContent.classList.add('active');
        marketContent.classList.remove('active');
    });

    marketTabBtn.addEventListener('click', () => {
        marketTabBtn.classList.add('active');
        warehouseTabBtn.classList.remove('active');
        marketContent.classList.add('active');
        warehouseContent.classList.remove('active');
    });

    // アドオンボタンのクリックイベント
    addonButton.addEventListener('click', () => {
        fileUploadInput.click();
    });

    // ファイル選択時のイベント
    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadAddon(file);
        }
    });

    // ドラッグ＆ドロップイベント
    // アドオンファイルをドラッグ＆ドロップで読み込むための設定
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, false);
    
    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) {
            loadAddon(file);
        }
    }, false);
    
    // ゲームループを開始
    gameLoop();
});


