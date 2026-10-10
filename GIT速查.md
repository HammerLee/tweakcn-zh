# Git 日常操作速查

> 针对本仓库（tweakcn-zh）的实际配置编写。通用命令在任何 git 仓库都适用；标注「本仓库」的条目只在这里成立。

## 0. 本仓库的三个特殊点（先看这个）

| 事项 | 说明 |
|---|---|
| 提交会先跑 lint | 已装 Node.js v24（位于 `~/.local/node`），pre-commit 钩子会执行 `next lint`：**有 Error 就提交失败**，Warning 不拦截。只有修不掉又必须提交时才临时加 `--no-verify` |
| 推送走 SSH 的 443 端口 | `github.com` 的 443 直连不通。`~/.ssh/config` 已把 `github.com` 映射到 `ssh.github.com:443`，**不要把 remote 改回 `https://` 开头的地址** |
| `upstream` 是只读镜像 | 指向 gh-proxy.com 代理的原项目，只能 `fetch`，不能 `push` |

## 1. 每天四步

```bash
cd /Users/joey/workspace/tutorial/tweakcn

git status                  # 1. 看改了什么（红=未暂存，绿=已暂存）
git add 文件路径             # 2. 挑选要提交的文件，可以写多个
git commit -m "feat: 一句话说明改动"   # 3. 固化成一个提交（钩子会跑 lint）
git push                    # 4. 推到 GitHub（已绑定，不用带参数）
```

提交信息建议前缀：`feat:` 新功能 / `fix:` 修 bug / `docs:` 文档 / `chore:` 依赖杂项 / `style:` 界面调整。

## 2. 查看

```bash
git log --oneline -10       # 最近 10 条提交，一行一条
git diff                    # 已修改但还没 add 的内容
git diff --cached           # 已 add 但还没 commit 的内容
git show 提交号              # 看某一次提交改了什么
git status -sb              # 精简状态 + 与远程的领先/落后
git remote -v               # 看远程地址（origin=你的仓库，upstream=原项目）
```

## 3. 撤销（按危险程度排序）

```bash
git restore 文件路径          # 安全：丢弃工作区改动，回到上次提交的样子
git restore --staged 文件路径  # 安全：把已 add 的文件退回未暂存，内容不丢
git commit --amend              # 中等：修改「最近一次」提交，仅限还没 push 时
git reset --hard HEAD~1     # 危险：丢弃最近一次提交及其改动，找不回来
```

> 原则：**没 push 之前怎么改都容易，push 之后再改历史很麻烦。** 拿不准就先别用 `reset --hard`。

## 4. 同步原作者的更新

```bash
git fetch upstream          # 把原项目最新提交取到本地，不改动你的代码
git merge upstream/main     # 合并进你的 main，可能有冲突
git push                    # 推上去
```

遇到冲突：打开冲突文件搜索 `<<<<<<<`，手动保留想要的内容、删掉所有标记行，然后
`git add 冲突文件 && git commit`。

## 5. 常见报错对照

| 报错 | 原因 | 处理 |
|---|---|---|
| `Failed to connect to github.com port 443` | 用了 https:// 地址，被墙 | `git remote -v` 确认是 `git@github.com:...` |
| `remote unpack failed: index-pack failed` | 多半是浅克隆缺历史 | `git fetch --unshallow upstream` 后重推 |
| `husky - pre-commit script failed (code 127)` | 当前进程 PATH 里没有 node（从 Dock 启动的 GUI 工具常这样，它们不读 `~/.zshrc`） | 终端里提交一般正常；GUI 里遇到就执行 `sudo ln -s ~/.local/node/bin/* /usr/local/bin/`，或改从终端启动该工具 |
| `Updates were rejected ... non-fast-forward` | 远程有你本地没有的提交 | 先 `git pull` 再 `git push` |
| `Permission denied (publickey)` | SSH 密钥没被认可 | `ssh -T git@github.com` 看提示；确认公钥已添加到 GitHub |

## 6. 安全守则

- **私钥 `~/.ssh/id_ed25519` 永远不外传**；公钥 `id_ed25519.pub` 才是可以公开的那一个
- 令牌（`ghp_` 开头）等同于密码，截图、发聊天之前先打码
- 别把 `.env`、密码、密钥提交进仓库（本仓库 `.gitignore` 已忽略 `.env`）
- 克隆新项目别用 `--depth 1`，除非你确定以后不会推送它

## 7. 一张图记住流程

```
工作区 --git add--> 暂存区 --git commit--> 本地仓库 --git push--> GitHub
         git restore        git restore --staged
```
