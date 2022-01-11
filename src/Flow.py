import copy
class Flow():
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

def createflow(func):
    return Flow(func)