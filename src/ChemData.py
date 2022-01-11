from rdkit import Chem
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
from .Node import nodify

import pandas as pd
import pandas as pd
import pandas as pd 
import pandas as pd
import pandas as pd
import pandas as pd
import pandas as pd
@nodify(node_type='Source', fields={'SMILES' : 'SMILES'})
def ChemCSVReader(inp : str) -> pd.DataFrame:
    df = pd.read_csv(inp)
    return df

import pandas as pd
import pandas as pd
@nodify(requires=['SMILES'],adds=['MOLS'])
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

@nodify(requires=['MOLS'],adds=['NODE_FEATURES'])
def GetAtomFeatures(inp : pd.DataFrame) -> pd.DataFrame:
    inp['NODE_FEATURES'] = inp['MOLS'].apply(get_atom_features)
    return inp


@nodify(requires=['MOLS'],adds=['GRAPH'])
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

@nodify(requires=['GRAPH','SMILES','NODE_FEATURES'])
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

@nodify(num_outputs = 2)
def testOr(inp1 : pd.DataFrame,inp2: pd.DataFrame):
    return [inp1,inp2]


import pandas as pd
@nodify(requires=['MOLS'],adds=['NODE_FEATURES'])
def GetAtomFeaturesy(inp : pd.DataFrame) -> pd.DataFrame:
    inp['NODE_FEATURES'] = inp['MOLS'].apply(get_atom_features)
    return inp
