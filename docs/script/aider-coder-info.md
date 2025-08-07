# Aider Information

## From Docs

```python
from aider.coders import Coder
from aider.models import Model
# This is a list of files to add to the chat
fnames = ["greeting.py"]
model = Model("gpt-4-turbo")
# Create a coder object
coder = Coder.create(main_model=model, fnames=fnames)
# This will execute one instruction on those files and then return
coder.run("make a script that prints hello world")
# Send another instruction
coder.run("make it say goodbye")
# You can run in-chat "/" commands too
coder.run("/tokens")
```

See the `Coder.create()` and `Coder.init()` methods for all the supported arguments.

It can also be helpful to set the equivalent of `--yes` by doing this:

```python
from aider.io import InputOutput
io = InputOutput(yes=True)
# rest of code
coder = Coder.create(model=model, fnames=fnames, io=io)
```

## From Aider Code
