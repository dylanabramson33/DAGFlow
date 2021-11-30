from Node import Node

class Context():
    '''
    An object for tracking various properties of a flow 
    (i.e. logging errors, storing results, hyperparemeters, etc.)
    '''
    def __init__(self):
        self.context = {}

    def add_to_context(self,key,value):
        self.context[key] = value

class BaseFlow():
    def __init__(self,node_list):
        self.node_list = node_list
        self.context = Context()
    
    def run(self,inp):
        self.__compile()
        
        outputs = [self.node_list[0](inp)]
        for node_index in range(1,len(self.node_list)):
            new_outputs = []
            current_node = self.node_list[node_index]
            for i,output in enumerate(outputs):
                if current_node.num_inputs() == 1:
                    if current_node.num_outputs() == 1:
                        new_output = current_node(output)
                        new_outputs.append(new_output)
                    else:
                        new_output_list = current_node(output)
                        for op in new_output_list:
                            new_outputs.append(op)
                else: 
                    args = []
                    for i in range(current_node.num_inputs()):
                        args.append(outputs[i])
                    if current_node.num_outputs() == 1:
                        new_output = current_node(*args)
                        new_outputs.append(new_output)
                    else:
                        new_output_list =current_node(*args)
                        for op in new_output_list:
                            new_outputs.append(op)
                    
                        
                    
            
            outputs = new_outputs
            print(len(outputs),node_index)
              
        return outputs

    def __compile(self):
        dependency_list = [depdency for depdency in self.node_list[0].output_state_additions()]
        
        for node_index in range(1,len(self.node_list)):
            current_node = self.node_list[node_index]
            if isinstance(current_node,Node):
                for dependency in current_node.get_dependencies():
                    if dependency not in dependency_list:
                        raise TypeError(str(type(current_node)) + ":" + dependency.state_type + " NOT FOUND")
                
                for dependency in current_node.output_state_additions():
                    dependency_list.append(dependency)
                
            
        
        return 

