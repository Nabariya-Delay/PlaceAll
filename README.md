# PlaceAll - Adobe Illustrator Extension

Illustrator上で複数のファイル（画像、PDFなど）を一括で配置できる。

## インストール（配置先のパス）

（`PlaceAll`フォルダ）を、使用しているOSのCEP拡張機能用ディレクトリに配置する。

### Mac の場合
* **ユーザーごとのインストール（推奨）**
  `~/Library/Application Support/Adobe/CEP/extensions/`
* **システム全体（全ユーザー）へのインストール**
  `/Library/Application Support/Adobe/CEP/extensions/`

### Windows の場合
* **ユーザーごとのインストール（推奨）**
  `C:\Users\<ユーザー名>\AppData\Roaming\Adobe\CEP\extensions\`
* **システム全体（全ユーザー）へのインストール**
  `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\`

---

## 未署名エクステンションの有効化（デバッグモード）

未署名の状態であるため、そのままではIllustratorに読み込まれない。OSの設定で **PlayerDebugMode（デバッグモード）** をオンにする必要がある。

### Mac の場合
ターミナル（Terminal.app）を開き、以下のコマンドをコピー＆ペーストして実行（Enter）してください。

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```
> **注意**: `CSXS.11` の数字部分はIllustratorのバージョン（内部のCEPバージョン）によって異なる。Illustrator 2022以降は `11` が標準だが、もしエクステンションが表示されない場合は、以下のようによく使われるバージョンをすべてオンにしておくといい。
```bash
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.12 PlayerDebugMode 1
```
コマンド実行後、**Macを再起動** するか、ターミナルで `killall cfprefsd` を実行して設定を反映させる。その後、Illustratorを起動する。

### Windows の場合
コマンドプロンプトやPowerShellを開き、以下のコマンドを実行する。

```cmd
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d "1" /f
```
> Mac同様、数字部分はCEPのバージョン。念のため複数バージョンで設定しておく場合は以下を実行。
```cmd
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d "1" /f
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d "1" /f
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d "1" /f
reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d "1" /f
```
実行後、Illustratorを再起動。

---

## 使い方

1. インストールおよびデバッグモードの有効化が完了したら、Adobe Illustratorを起動する。
2. 上部メニューバーから **`ウィンドウ`** > **`エクステンション`** > **`PlaceAll`** を選択。
3. パネルが表示される。
4. ファイルを読み込んで配置機能を使用する。finderやExplorerから直接ドラッグ&ドロップするか、ここにドロップの部分をクリックするとファイルを選べるのでそっちから選んでもいい。

## 設定できる項目
- 折返し
  - 配置するアートボードの列数を指定する。
- 間隔
  - 配置する間隔を指定できる。
- アートボードの作成
  - 配置したファイルのサイズのアートボードを作れる。チェック外せば作らないようにすることもできる。
- ページ範囲指定
  - 通常の配置と同じようにページ範囲を指定できる   
