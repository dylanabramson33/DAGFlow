from rdkit import Chem
import copy
import numpy as np
import torch
from torch_geometric.data import Data
from torch_geometric.data import DataLoader
import pandas as pd
from sklearn.model_selection import train_test_split
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
            
class Pipeline():
    def __init__(self,pipeline): 
        self.pipeline = pipeline
       
    def compile(self):
        print("---COMPILING---")
        self.compiled = self.pipeline()
        print(self.compiled)
    
    def run(self):
        print("---RUNNING---")
        comp_dic = {}
        node_data = self.compiled['node_data']
        current_op = node_data[0].func
        current_args = node_data[0].args
        current_kwargs = node_data[0].kwargs
        node_id = node_data[0].node_id
        current_comp = current_op(*current_args,**current_kwargs)
        comp_dic[node_id] = current_comp

        for index in range(1,len(node_data)):
            node_id = node_data[index].node_id
            if node_id in comp_dic:
                continue 

            current_op = node_data[index].func
            current_args = node_data[index].args
            current_kwargs = node_data[index].kwargs
            altered_args = []
            for arg in current_args:
                if type(arg) == dict and '_requires_compute' in arg:
                    compute_key = arg['_requires_compute']
                    altered_args.append(copy.copy(comp_dic[compute_key]))
                else:
                    altered_args.append(arg)
            
           
            current_comp = current_op(*altered_args,**current_kwargs)
            
            if node_data[index]._node_tag != None:
                current_comp = current_comp[node_data[index]._node_tag]

            comp_dic[node_id] = current_comp
        return current_comp


def Nodify(**kwargs):
    def wrapper(func):
        return Node(func,**kwargs)
    
    return wrapper

def createpipeline(func):
    return Pipeline(func)

@Nodify(node_type='Source', fields={'SMILES' : 'SMILES'})
def ChemCSVReader(inp : str) -> pd.DataFrame:
    df = pd.read_csv(inp)
    return df

@Nodify(requires=['SMILES'],adds=['MOLS'])
def ChemAddMol(inp : pd.DataFrame) -> pd.DataFrame:
    inp['MOLS'] = inp['SMILES'].apply(Chem.MolFromSmiles)
    return inp

def get_atom_features(mol):
    feature_mat = np.zeros((mol.GetNumAtoms(),75))
    index = 0 
    while index <= mol.GetNumAtoms()-1:
        atomObj = mol.GetAtomWithIdx(index) 
        atom_feature = dc.feat.graph_features.atom_features(atomObj)
        feature_mat[index] = atom_feature
        index+=1
        
    return feature_mat

@Nodify(requires=['MOLS'],adds=['NODE_FEATURES'])
def GetAtomFeatures(inp : pd.DataFrame) -> pd.DataFrame:
    inp['NODE_FEATURES'] = inp['MOLS'].apply(get_atom_features)
    return inp


@Nodify(requires=['MOLS'],adds=['GRAPH'])
def GetMoleculeGraph(inp : pd.DataFrame) -> pd.DataFrame:
    inp['GRAPH'] = inp['MOLS'].apply(Chem.rdmolops.GetAdjacencyMatrix)
    return inp


def convert_to_coo(adj_matrix):
        row, col = np.where(adj_matrix)
        coo = np.array(list(zip(row,col)))
        coo = np.reshape(coo,(2,-1))
        return coo
    
def make_torch_data_list(row,
                         target_field,
                         target_fields):
    coo = row['COO']
    node_features = row['NODE_FEATURES']
    edge_index = torch.tensor(coo,dtype=torch.long)
    X = torch.tensor(node_features,dtype=torch.float)
    smiles = row['SMILES']

    if target_field:
        y = row[target_field]
        y = torch.tensor([y],dtype=torch.float)
        return Data(x=X,edge_index=edge_index,y=y,smiles=smiles)

    elif target_fields:
        ys = []
        for y in target_fields:
            ys.append(y)
        ys = torch.tensor(ys,dype=torch.float)
        return Data(X=X,edge_index=edge_index,ys=ys,smiles=smiles)

@Nodify(requires=['GRAPH','SMILES','NODE_FEATURES'])
def convertToTorchGNNLoader(inp : pd.DataFrame,
                            target_field : str=None,
                            target_fields : str=None,
                            batch_size : int=2,
                            shuffle : bool=True,
                            drop_last : bool=True) -> pd.DataFrame:
    
    inp['COO'] = inp['GRAPH'].apply(convert_to_coo)
    torch_data_df = inp.apply(lambda row : make_torch_data_list(row,target_field,target_fields), axis = 1) 
    torch_data_list = torch_data_df.values
    return DataLoader(torch_data_list,shuffle=shuffle,batch_size=batch_size,drop_last=drop_last) 

@Nodify(num_outputs = 2)
def testOr(inp1 : pd.DataFrame,inp2: pd.DataFrame):
    return [inp1,inp2]

registry = [ChemCSVReader,
            ChemAddMol,
            GetAtomFeatures,
            GetMoleculeGraph,
            convertToTorchGNNLoader,
            testOr]

# @createpipeline
# def pipe():
#     df = ChemCSVReader('./solubility_data.csv')
#     df1 = ChemAddMol(df)
#     df2 = GetMoleculeGraph(df1)
#     df3,df4 = testOr(df,df2)
#     return df3

# pipe.compile()
# val = pipe.run()

# print(val)