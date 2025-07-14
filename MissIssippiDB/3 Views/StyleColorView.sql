drop view if exists StyleColorView 
go 

create view StyleColorView as (
select 
s.StyleNumber,
c.ColorName,
se.SeasonName,
sc.StyleColorId, 
sc.ColorId,
sc.StyleId,
se.SeasonId
from StyleColor sc
join Style s 
on sc.StyleId = s.StyleId
join Color c 
on sc.ColorId = c.ColorId
join Season se 
on s.SeasonId = se.SeasonId
)
