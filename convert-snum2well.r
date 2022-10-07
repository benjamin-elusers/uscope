is.even = function(x){ x %% 2 == 0 }
is.odd = function(x){ x %% 2 != 0 }

get.snum = function(r_idx, # row index
                    c_idx, # col index
                    NROW=16,NCOL=24, # plate format (rows/cols)
                    NPIC=10 # num pic per well
){
  num = (r_idx-1) * NCOL * NPIC
  offset_odd=  (c_idx-1)*NPIC + 1
  offset_even=  (NCOL-c_idx+1)*NPIC
  offset= is.even(r_idx) * offset_even + is.odd(r_idx) * offset_odd

  #if( r_idx %% 2 != 0 ){ # Left-to-right on even rows (1,3,5,7... => A,C,E,G..)
  #  num = num + (c_idx-1)*NPIC + 1
  #}else if ( r_idx %% 2 == 0 ){  ## Right-to-Left on odd rows (2,4,6,8... => B,D,F,H...)
  #  num = num +
  #}
  return(  num + offset)
}

get_well_snum = function(well=c('A01','B24'),NR=16,NC=24,NP=10){
  library(stringr)

  ROWS = LETTERS[1:NR]
  COLS = 1:NC
  L = length(well)

  R= str_sub(well,1,1)
  C = str_sub(well,2)

  row=match(R,LETTERS)
  col=match(as.numeric(C),COLS)

  start = get.snum(row,col,NR,NC,NP)
  DIRECTION = (-1) ^ (is.odd(row)+1) # 1 if row is odd otherwise -1
  end = start + (DIRECTION * NP) - DIRECTION

  pos = sapply(1:L, function(x){ start[x]:end[x]},USE.NAMES = T)
  colnames(pos) = well
  return(t(pos))
}
# TEST
WELLS= c('A01','A23','A24','B24','B23','B02','B01')

sapply(WELLS,get_well_snum)
get_well_snum(WELLS)
get_well_snum('P01')

well2snum = function(NR=16,NC=24,NP=8){

  fullplate = expand.grid(ROW=LETTERS[1:NR],COL=sprintf("%02d",1:NC)) %>%
    dplyr::rowwise() %>%
    dplyr::mutate(well=paste0(ROW,COL))

  get_well_snum(well = sort(fullplate$well),NP = NP, NR = NR, NC = NC)
}

well2snum(NR=16,NC=24,NP=8) # for 384 (16 rows * 24 columns) with 8 pictures per well
