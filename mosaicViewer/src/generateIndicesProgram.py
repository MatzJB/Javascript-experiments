

import random

def writeIndices(numberOfElements, maxInt, filename):
    ''' Writes indices based on arguments for mosaic viewer (javascript) '''

    print "Writing {} indices ranging [{},{}] to file '{}'".format(numberOfElements, 1, maxInt, filename)

    f = open(filename, 'w')
    for i in range(numberOfElements):
        tmp = str(int(random.random() * maxInt+1))
        f.write(tmp)
        
        if i != numberOfElements-1:
            f.write(',\n')

            
    f.close() 


writeIndices(50, 4, 'indices')