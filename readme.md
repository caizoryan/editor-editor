# What do you need to make an Editor:

- [FRONTEND](#frontend) Ability to edit text
- [BACKEND](#backend) Ability to save text

# Editor writes code, Editor runs on Code, Editor writes Editor
The editor outputs an HTML file and runs from an HTML file. The editor also has a basic backend to save the files, directories, etc. 

A single instance of this editor can be used to edit itself.

This project is just a simple idea to bootstrap an editor. The idea is to have something like neovim which is extremely configurable and modular. This editor aims to do the same but with html, css and js at its core. 


# Priorities:

- DIY
- Minimal dependencies
- Be able to edit itself
- Always have access to files/data (similar to obsidian)

### Frontend

### Backend
- Backend has an /fs endpoint
- Read file or directory
- Create new file or directory
- Update file
