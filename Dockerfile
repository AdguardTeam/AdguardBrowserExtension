FROM node:18

RUN apt-get update && apt-get install fish mc vim curl sudo tmux -y && \
    echo "fish" >>~/.bashrc

RUN echo 'root:123' | chpasswd
RUN echo 'node:123' | chpasswd

RUN sudo usermod -a -G sudo node

USER node

# customize tmux
RUN cd && \
    git clone https://github.com/gpakosz/.tmux.git && \
    ln -s -f .tmux/.tmux.conf && \
    cp .tmux/.tmux.conf.local .

# upd configs for cli tools
RUN echo "fish" >>~/.bashrc
RUN mkdir -p ~/.config/fish
RUN echo "alias tmux='tmux -2'" >>~/.config/fish/config.fish
RUN echo "set -U fish_prompt_pwd_dir_length 0" >>~/.config/fish/config.fish

# install lazygit
RUN wget https://github.com/jesseduffield/lazygit/releases/download/v$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')/lazygit_$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')_Linux_32-bit.tar.gz -P ~/.lazygit/
RUN tar -xf ~/.lazygit/lazygit_$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')_Linux_32-bit.tar.gz -C ~/.lazygit/
RUN echo "alias lazygit='~/.lazygit/lazygit'" >>~/.config/fish/config.fish
RUN echo "alias lz='~/.lazygit/lazygit'" >>~/.config/fish/config.fish
RUN git config --global core.autocrlf true
RUN git config --global --add safe.directory '*'

WORKDIR /app

