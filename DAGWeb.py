import inspect
from flask import Flask
from flask import render_template
from numpy.core.numeric import False_
from src import ChemData
from inspect import isclass
from flask import request
from src.Node import nodify
from src.Flow import createflow
import traceback
import re 
from rdkit import Chem
app = Flask('app')
import sys
import traceback

class InterpreterError(Exception): pass
def my_exec(cmd, description='source string'):
    try:
        exec(cmd,globals()) 
    except SyntaxError as err:
        error_class = err.__class__.__name__
        detail = err.args[0]
        line_number = err.lineno
    except Exception as err:
        error_class = err.__class__.__name__
        detail = err.args[0]
        cl, exc, tb = sys.exc_info()
        line_number = traceback.extract_tb(tb)[-1][1]
    else:
        return
    raise InterpreterError("%s at line %d of %s: %s" % (error_class, line_number, description, detail))

def methodsWithDecorator(cls, decoratorName):
    sourcelines = inspect.getsourcelines(cls)[0]
    seen_decorator = False 
    for i, line in enumerate(sourcelines):
        line = line.strip()
        if line.split('(')[0].strip() == '@' + decoratorName:  # leaving a bit out
            seen_decorator = True
        if seen_decorator and 'def' in line:
            name = line.split('def')[1].split('(')[0].strip()
            seen_decorator = False
            yield name

def replace_source(new_source,old_source): 
    with open('./src/ChemData.py', 'r') as file :
        filedata = file.read()

    # Replace the target string
    filedata = filedata.replace(old_source, new_source)

    # Write the file out again
    with open('./src/ChemData.py', 'w') as file:
        file.write(filedata)

def add_to_source(new_source):
    with open('./src/ChemData.py', 'r') as file :
        filedata = file.read()

    # Replace the target string
    filedata += '\n' + new_source

    # Write the file out again
    with open('./src/ChemData.py', 'w') as file:
        file.write(filedata)

def get_attrs(node_list,source=None):
    '''
    Returns a dictionary mapping each node to the arguments it 
    takes. Used for generating configuration window
    '''
    node_names = []
    node_attrs = {}
    function_to_source = {}

    for node in node_list:
        node_name = node.func.__name__

        node_names.append(node_name)
        node_output = node.return_ann.__name__
        args = []
        if not source:
            function_to_source[node_name] = inspect.getsource(node.func)
        else:
            function_to_source[node_name] = source
        
        for arg,t in node.annotated.items():  
            args.append({'arg' : arg, 'type' : t.annotation.__name__,'val' : '','has_input' : False})
        
        args.append({'output_type' : node_output, 'output_val' : ''})
        node_attrs[node_name] = args

    return node_names,node_attrs,function_to_source

@app.route('/send_graph',methods = ['POST'])
def send_graph():
    json = request.json
    source = json['source']
    exec(source,globals())
    val = output.iloc[:40]
    return_json = val.to_json(orient='records')
    return return_json



@app.route('/update_node_source',methods = ['POST'])
def send_node_source():
    json = request.json
    source = json['new_source']
    old_source = json['old_source']
    try:
        exec(source)
        function_name = re.search('(def\s*)(.*)(\()',source).group(2)
        new_node = [eval(function_name)]
        _,node_attrs,_ = get_attrs(new_node,source=source)
        if old_source:
            replace_source(source,old_source)
        else:
            add_to_source(source)
            
        return node_attrs
    except Exception as e:
        print(e) 
        return {'message' : 'fail'}

@app.route('/')
def index():
    funcNames = [i for i in methodsWithDecorator(ChemData,'nodify')]
    nodes = [getattr(ChemData,funcName) for funcName in funcNames]
    node_names,node_attrs,function_to_source = get_attrs(nodes)
    return render_template('hello.html',len=len(nodes),
                                        nodes=node_names,
                                        node_attrs=node_attrs,
                                        function_to_source=function_to_source)


app.run(host = 'localhost', port = 5501,debug=True)