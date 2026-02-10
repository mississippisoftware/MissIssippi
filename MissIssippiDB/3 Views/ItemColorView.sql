create view ItemColorView as (
select 
s.ItemNumber,
c.ColorName,
c.PantoneColor,
c.HexValue,
ColorSeasonId = c.SeasonId,
se.SeasonName,
sc.ItemColorId, 
sc.ColorId,
sc.ItemId,
se.SeasonId
from ItemColor sc
join Item s 
on sc.ItemId = s.ItemId
join Color c 
on sc.ColorId = c.ColorId
join Season se 
on s.SeasonId = se.SeasonId
)
