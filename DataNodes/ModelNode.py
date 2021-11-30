from rdkit import Chem
from ..Interfaces import INode
from ..DataState import DataState

import numpy as np
import torch
from torch_geometric.data import Data
from torch_geometric.data import DataLoader
import deepchem as dc
import pandas as pd
from sklearn.model_selection import train_test_split

class TrainModelNode(INode):
    def __init__(self,model=None,data_dependencies=None):
        self.model = model
        self.data_dependencies = data_dependencies

    def get_dependencies(self):
        if self.data_dependencies:
            return self.data_dependencies
        
        return []
    
    def num_outputs(self):
        return 1
    
    def num_inputs(self):
        return 2

    def output_state_additions(self):
        return []
    
    def apply_node(self,train_loader,test_loader):
        return self.model.train(train_loader,test_loader)

    __call__ = apply_node