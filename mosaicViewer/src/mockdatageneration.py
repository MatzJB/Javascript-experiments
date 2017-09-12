# Author: MatzJB

'''
1 - Ths code produces a mosaic sprite map and a json object referencing the indices.
2 - This code also outputs an example mosaic to use in mosiacViewer.
'''
from PIL import Image
import argparse
#import ctypes
#import random
#import getopt
#import time
import json
import math
import sys
import os

from PIL import ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

def writeJson(dict, outfilename):
    outfile = open(outfilename, 'wb')
    with outfile:
        json.dump(dict, outfile, sort_keys=True,
            indent=4, separators=(',', ': '))
        outfile.write('\n')

def getFilesFromDir(path, suffix):
    ''' return directory listing using suffix, only one level down '''
    return [path + name for name in os.listdir(path) if name.endswith(suffix)]

def replaceSuffix(filename, suffix):
    ''' replace suffix in filename with suffix ''' 
    if suffix[0] != '.':
        suffix = '.' + suffix
    return '.'.join(filename.split('.')[0:-1]) + suffix

def createSpritemap(rows, filenames):
    ''' Create sprite map using indexArray (row-major) indexing the file array
    Todo: check that the size of the images (mosels) are the same '''
    cols = math.ceil( float(len(filenames)) / rows )
    cols = int(cols)
    rows = int(rows)
    img = Image.open(filenames[1])
    wMosel, hMosel = img.size
    imageWall = Image.new("RGBA", (cols*wMosel, rows*hMosel))
  
    index = 0
    for r in range(1, rows + 1):
        for c in range(1, cols + 1):
            if index < len(filenames):
                filename = filenames[index]
                img = Image.open(filename)
                imageWall.paste(img, ((r-1)*wMosel, (c-1)*hMosel))
                index += 1
    return imageWall
 
def createMockMosaicMatrix(nCols, nRows, mosels):
    ''' return matrix array using mosels filenames '''
    # assert the max index < len(mosels) min >=0
    indexArray = [1, 1, 2, 2, 3, 3, 3, 3, 3, 2]
    return indexArray

parser = argparse.ArgumentParser(description='Program used to create mosaic mockup data for mosaic visualiser')
parser.add_argument('-c', help = "number of columns", type = int, 
					default = 3, required = False)
parser.add_argument('-r', help = "verbose output", type = int, 
					default = 3, required = False)
parser.add_argument("--inputPath", help = "path to mosels to read from", type = str, 
					default = '.')
parser.add_argument("--spritemapFilename", help = "spritemap json and color data filename", type = str, 
					default = 'test.png')

parser.add_argument("--mosaicFilename", help = "mosaic data json filename", type = str, 
					default = 'mosaic.json')

args = vars(parser.parse_args())
nCols = args['c']
nRows = args['r']
inputPath = args['inputPath']
spritemapFilename = args['spritemapFilename']
mosaicFilename = args['mosaicFilename']

# moselFilename = getFilesFromDir(inputPath, '.jpg')
print 'creating spritemap'
moselFilename = getFilesFromDir('./mosels/', '.jpg')
imageWall = createSpritemap(2, moselFilename)
imageWall.save(spritemapFilename)

spritemapJson = {"metadata": {"columns":nCols, "rows":nRows}, "colordata":spritemapFilename}
spritemapJsonFilename = replaceSuffix(spritemapFilename, 'json')
writeJson(spritemapJson, spritemapJsonFilename)

print "creating spritemap:", spritemapJsonFilename

nCols = 10
nRows = 10
arr = createMockMosaicMatrix(nCols, nRows, moselFilename)
mosaicData = {"metadata": {"columns": nCols, "rows": nRows}, 
              "spriteMap": spritemapJsonFilename, "mosaicIndices": arr}

mosaicJsonFilename = './mosaic.json'
writeJson(mosaicData, mosaicJsonFilename)
print "creating spritemap:", mosaicJsonFilename
