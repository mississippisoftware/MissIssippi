create view ItemView as (
select 
s.ItemNumber, 
s.[Description], 
s.CostPrice, 
s.WholesalePrice, 
s.Weight, 
se.SeasonName,
se.SeasonDateCreated,
SeasonActive = se.Active,
s.ItemDateCreated,
s.InProduction,
s.ItemId,
s.SeasonId
from Item s
join Season se 
on s.SeasonId = se.SeasonId
)

