# DAGFlow

## What is DAGFlow?
DAGFlow is a tool to create and manage directed acyclic graphs for training and deploying machine learning models. 

## Why Did I create DAGFlow?
I noticed myself creating lots of duplicated functionality across many ML projects. With DAGFlow, I hope to create a framework that encourages modular processing/querying for easy reuse of components across many projects. I also wanted a low-code solution to allow deployment of ML pipelines for scientists without webdev experience. 

## How it works
The core object in DAGFlow is the "flow"'. A flow defines a sequence of transformations of data through "Nodes". Below is an example flow that takes an input dataframe with a SMILES field (a string representation of molecule) and adds a column containing the bond adjacency matrix of the molecule:
```python
from Flows import createflow
From Node import nodify
from rdkit import Chem
import pandas as pd

@nodify(node_type='Source', fields={'SMILES' : 'SMILES'})
def ChemCSVReader(inp : str) -> pd.DataFrame:
    df = pd.read_csv(inp)
    return df

@nodify(requires=['SMILES'],adds=['MOLS'])
def ChemAddMol(inp : pd.DataFrame) -> pd.DataFrame:
    inp['MOLS'] = inp['SMILES'].apply(Chem.MolFromSmiles)
    return inp

@nodify(requires=['MOLS'],adds=['GRAPH'])
def GetMoleculeGraph(inp : pd.DataFrame) -> pd.DataFrame:
    inp['GRAPH'] = inp['MOLS'].apply(Chem.rdmolops.GetAdjacencyMatrix)
    return inp
    
@createflow
def test_flow():
   df = ChemCSVReader('./solubility_data.csv')
   df = ChemAddMol(df)
   df = GetMoleculeGraph(df1)
   return df


test_flow.compile()
output = test_flow.run()
```

## GUI
No DAG library is complete without a slick GUI. DAGFlow includes DAGWeb, a flask app for creating DAG's with a drag and drop UI. Here is the same flow as above represented in the GUI.    
<img width="600" alt="Screen Shot 2022-01-08 at 2 19 58 PM" src="https://user-images.githubusercontent.com/34826285/148656940-e75d99ea-33c8-4997-b20a-ef7b6e160410.png">

The GUI contains a basic type checker (right now type annotations must be included but this will be optional in future), ensuring only nodes of compatible types can be linked together. 


