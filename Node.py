from inspect import getfullargspec
class Node():
    def __init__(self,num_inputs=1,
                      num_outputs=1,
                      input_deps=[],
                      outputs=[]):  
        apply_args = getfullargspec(self.apply)['args'] 
        self.args = apply_args                             
        self.num_inputs = list(filter(lambda x: x != 'self', apply_args))
        self.num_outputs = num_outputs
        self.input_deps = input_deps
        self.outputs = outputs

    def __call__(self, *args,**kwargs):
        context = kwargs.get('context',{})
        return self.apply(inp,**kwargs)
