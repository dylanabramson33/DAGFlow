import inspect
from flask import Flask
from flask import render_template
from DataNodes import ChemData
from inspect import isclass

app = Flask('app')

def get_attrs(node_list):
    '''
    Returns a dictionary mapping each node to the arguments it 
    takes. Used for generating configuration window
    '''
    node_names = []
    node_attrs = {}

    for node in node_list:
        node_name = node.func.__name__
        node_names.append(node_name)
        args = []

        for arg,t in node.annotated.items():  
            args.append({'arg' : arg, 'type' : t.annotation.__name__})

        node_attrs[node_name] = args

    return node_names,node_attrs



@app.route('/')
def index():
    nodes = ChemData.registry
    node_names,node_attrs = get_attrs(nodes)
    return render_template('hello.html',len=len(nodes),nodes=node_names,node_attrs=node_attrs)


app.run(host = 'localhost', port = 5500,debug=True)