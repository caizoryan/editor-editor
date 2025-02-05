# What do you need to make an Editor:
- [Frontend](#frontend) : Ability to edit text
- [Backend](#backend) : Ability to save text

### Editor writes code, Editor runs on Code, Editor writes Editor
The editor outputs an HTML file and runs from an HTML file. The editor also has a basic backend to save the files, directories, etc. 

A single instance of this editor can be used to edit itself.

This project is just a simple idea to bootstrap an editor. The idea is to have something like neovim which is extremely configurable and modular. This editor aims to do the same but with html, css and js at its core. 


# Priorities:

### General
- DIY
- Interoperablity
- Minimal dependencies
- Be able to edit itself
- Always have access to files/data (similar to obsidian)

### Technical
- Have editor and viewer share state (implemented as solid's reactive proxy: createMutable)
- Create a very basic base (fs, simple editor, simple viewer) and implement everything else as modular libraries

# Details?
I don't know what to call this section but just basic structure of the project

### Frontend
The basic structure of the frontend is as follows:

The editor can be thought of having layers where you can go up a layer or down a layer

A layer outputs an html file, using the outputed file is going down a layer

But we can jump back up a layer and use editor to create another output, hence updating a chain of layers

There is an editor component that basically renders a state as long as we have definedit in the layer above.


### Backend
- Backend has an /fs endpoint
- Read file or directory
- Create new file or directory
- Update file

# Dependencies
There are two major dependencies for this project:

1. SolidJS -> The reactive system is built on solidjs. I chose solid because it is extremely context agnostic and modular. I thought of using a lot of other libaries but this was perhaps the best choice when trying to avoid walled gardens.

2. Codemirror -> Codemirror is awesome! This project too is extremely modular and interoperable. The plugin system is very well designed and I really want to learn from it, and overall it is very fun to work with.
