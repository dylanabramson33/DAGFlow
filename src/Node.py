from inspect import getfullargspec
from inspect import signature
import inspect
from dataclasses import dataclass
from typing import Callable

def get_default_args(func):
    signature = inspect.signature(func)
    return {
        k: v.default
        for k, v in signature.parameters.items()
        if v.default is not inspect.Parameter.empty
    }

def dict_merge(dict1, dict2):
    res = {**dict1, **dict2}
    return res

@dataclass
class NodeFnClosure:
    func: Callable
    args : object
    kwargs : dict
    node_id : int
    _node_tag: int = None


class Node():
    id = 0
    def __init__(self,
                 func,
                 fields = None,
                 num_outputs = 1,
                 node_type='Processor',
                 requires=[],
                 adds=[]):
        self.func = func
        self.func_defaults = get_default_args(self.func)
        self.annotated = signature(func).parameters
        print(self.annotated)
        self.return_ann = signature(func).return_annotation
        self.node_type = node_type
        self.fields = fields
        self.requires = requires
        self.adds = adds
        self.num_outputs = num_outputs

    def __call__(self, *args,**kwargs):
        Node.id += 1
        self.id = Node.id
        print(self.func)
        
        if self.node_type == 'Source':
            context = {}
            closure = NodeFnClosure(self.func,args,kwargs,self.id)
            node_data = [closure]
            for key,field in self.fields.items():
                context[key] = field
            return {'node_data' : node_data, 'context' : context, '_node_id' : self.id}
        else: 
            node_args = []
            arg = args[0]
            context = {}
            node_data = []
            #Iterate over node arguments, if 
            #argument is a node, add pointer to node_id to avoid 
            #repeated computation at pipeline run time
            if '_node_id' in arg: 
                node_data += arg.get('node_data')  
                next_context = arg.get('context')
                context = dict_merge(next_context,context)
                node_id = arg.get('_node_id')
                node_args.append({'_requires_compute' : node_id})
            else:
                node_args.append(arg)
                
            for i in range(1,len(args)):
                arg = args[i]
                if '_node_id' in arg: 
                    node_data += arg.get('node_data')  
                    next_context = arg.get('context')
                    context = dict_merge(next_context,context)
                    node_id = arg.get('_node_id')
                    node_args.append({'_requires_compute' : node_id})
                else:
                    node_args.append(arg)
            
            for field in self.requires:
                if field not in context:
                    raise TypeError(field + " not in context, use node that computes " +
                            field + " before calling " + self.func.__name__)

            #if no kwargs passed in use defaults
            node_kwargs = self.func_defaults
            for key,value in kwargs.items():
                node_kwargs[key] = value
        
            for field in self.adds:
                context[field] = field

            new_data = node_data[:]

            if self.num_outputs == 1:
                closure = NodeFnClosure(self.func,node_args,node_kwargs,self.id)
                new_data.append(closure)
                data = {'node_data' : new_data, 'context' : context, '_node_id' : self.id}
                return data
            else:
                data = []
                for i in range(self.num_outputs):
                    closure = NodeFnClosure(self.func,node_args,node_kwargs,self.id,i)
                    new_data_cop = new_data[:]
                    new_data_cop.append(closure)
                    data.append({'node_data' : new_data_cop, 'context' : context, '_node_id' : self.id,'_node_tag' : i})
    
                return data

def nodify(**kwargs):
    def wrapper(func):
        return Node(func,**kwargs)
    
    return wrapper