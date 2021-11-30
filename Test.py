from Flows import BaseFlow
from DataNodes import ChemData
import pandas as pd

data_frame = pd.read_csv('solubility_data.csv')
print(data_frame.columns)
data_reader = ChemData.ChemPandasReader(smiles_field='SMILES')
build_mols = ChemData.BuildMol()

flow = BaseFlow([data_reader,build_mols])

print(flow.run(data_frame).columns)